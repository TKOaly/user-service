
aws s3 cp s3://user-service-state/plan-$1 plan_output-$1
terraform apply plan_output-$1
