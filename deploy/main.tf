terraform {
  backend "s3" {
    region = "eu-west-1"
    bucket = "user-service-state"
    key    = "user-service-state"
  }
}

provider "aws" {
  profile = "tekis"
  region  = "eu-west-1"
}

data "aws_ssm_parameter" "user_service_db_host" {
  name = "user-service-db-host"
}

data "aws_ssm_parameter" "user_service_db_port" {
  name = "user-service-db-port"
}

data "aws_ssm_parameter" "user_service_db_user" {
  name = "user-service-db-user"
}

data "aws_ssm_parameter" "user_service_db_password" {
  name = "user-service-db-password"
}

data "aws_ssm_parameter" "user_service_db_name" {
  name = "user-service-db-name"
}

data "aws_ssm_parameter" "user_service_jwt_secret" {
  name = "user-service-jwt-secret"
}

data "aws_ssm_parameter" "user_service_raven_dsn" {
  name = "user-service-raven-dsn"
}

data "aws_ssm_parameter" "user_service_session_secret" {
  name = "user-service-session-secret"
}

data "aws_vpc" "tekis_vpc" {
  filter {
    name   = "tag:Name"
    values = ["tekis-VPC"]
  }
}

data "aws_subnet_ids" "user_service_subnets" {
  vpc_id = "${data.aws_vpc.tekis_vpc.id}"
  filter {
    name   = "tag:Name"
    values = ["tekis-private-subnet-1a", "tekis-private-subnet-1b"]
  }
}

data "aws_ecr_repository" "user_service_repo" {
  name = "user-service"
}

data "aws_ecs_cluster" "cluster" {
  cluster_name = "christina-regina"
}

data "aws_lb" "tekis_lb" {
  name = "tekis-loadbalancer-1"
}

data "aws_lb_listener" "alb_listener" {
  load_balancer_arn = "${data.aws_lb.tekis_lb.arn}"
  port              = 443
}

resource "aws_iam_role" "user_service_execution_role" {
  name               = "user-service-execution-role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "user_service_execution_role_policy" {
  name = "user-service-execution-role-policy"
  role = aws_iam_role.user_service_execution_role.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_security_group" "user_service_task_sg" {
  name   = "user-service-task-sg"
  vpc_id = data.aws_vpc.tekis_vpc.id

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_alb_target_group" "user_service_lb_target_group" {
  name        = "cb-target-group"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.tekis_vpc.id
  target_type = "ip"

  health_check {
    path    = "/ping"
    matcher = 200
  }
}

resource "aws_alb_listener_rule" "user_service_listener_rule" {
  listener_arn = data.aws_lb_listener.alb_listener.arn

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.user_service_lb_target_group.arn
  }

  condition {
    host_header {
      values = ["users.tko-aly.fi"]
    }
  }
}


resource "aws_cloudwatch_log_group" "user_service_cw" {
  name = "/ecs/christina-regina/user-service"
}

resource "aws_ecs_task_definition" "user_serivce_task" {
  family                   = "user-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.user_service_execution_role.arn
  container_definitions    = <<DEFINITION
[
  {
    "name": "user_service_task",
    "image": "${data.aws_ecr_repository.user_service_repo.repository_url}:latest",
    "cpu": 256,
    "memory": null,
    "memoryReservation": null,
    "essential": true,
    "portMappings": [{
      "containerPort": 3001,
      "hostPort": 3001,
      "protocol": "tcp"
    }],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "${aws_cloudwatch_log_group.user_service_cw.name}",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "ecs",
        "awslogs-datetime-format": "%Y-%m-%d %H:%M:%S"
      }
    },
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "COOKIE_DOMAIN", "value": "tko-aly.fi"},
      {"name": "API_VERSION", "value": "v1"},
      {"name": "USERSERVICE_PORT", "value": "3001"},
      {"name": "DEFAULT_LOCALE", "value": "fi"},
      {"name": "COOKIE_DOMAIN", "value": "tko-aly.fi"}
    ],
    "secrets": [
      {"name": "DB_HOST", "valueFrom": "${data.aws_ssm_parameter.user_service_db_host.arn}"},
      {"name": "DB_PORT", "valueFrom": "${data.aws_ssm_parameter.user_service_db_port.arn}"},
      {"name": "DB_USER", "valueFrom": "${data.aws_ssm_parameter.user_service_db_user.arn}"},
      {"name": "DB_PASSWORD", "valueFrom": "${data.aws_ssm_parameter.user_service_db_password.arn}"},
      {"name": "DB_NAME", "valueFrom": "${data.aws_ssm_parameter.user_service_db_name.arn}"},
      {"name": "JWT_SECRET", "valueFrom": "${data.aws_ssm_parameter.user_service_jwt_secret.arn}"},
      {"name": "RAVEN_DSN", "valueFrom": "${data.aws_ssm_parameter.user_service_raven_dsn.arn}"},
      {"name": "SESSION_SECRET", "valueFrom": "${data.aws_ssm_parameter.user_service_session_secret.arn}"}
    ]
  }
]
DEFINITION
}

resource "aws_ecs_service" "user_service" {
  name            = "user-service"
  cluster         = data.aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.user_serivce_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups = ["${aws_security_group.user_service_task_sg.id}"]
    subnets         = data.aws_subnet_ids.user_service_subnets.ids
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.user_service_lb_target_group.arn
    container_name   = "user_service_task"
    container_port   = 3001
  }

  depends_on = [
    aws_alb_target_group.user_service_lb_target_group
  ]
}
