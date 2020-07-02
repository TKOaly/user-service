
terraform plan --out=./plan_output-$1 "./deploy"
aws s3 cp plan_output-$1 s3://user-service-state/plan-$1
