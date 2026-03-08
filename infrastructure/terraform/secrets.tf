resource "aws_secretsmanager_secret" "backend_secrets" {
  name = "${var.project_name}-backend-secrets-new"
}

resource "aws_secretsmanager_secret_version" "backend_secrets_version" {
  secret_id     = aws_secretsmanager_secret.backend_secrets.id
  secret_string = jsonencode({
    DATABASE_URL = "postgresql://${aws_db_instance.main.username}:${aws_db_instance.main.password}@${aws_db_instance.main.endpoint}/trackcodex_db"
    JWT_SECRET   = "super-secret-key-change-this-in-production"
    # Add other secrets here as needed
  })
}

# IAM policy for the ECS task to read these secrets
resource "aws_iam_policy" "secrets_policy" {
  name        = "${var.project_name}-secrets-policy"
  description = "Allow ECS to read backend secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect   = "Allow"
        Resource = [aws_secretsmanager_secret.backend_secrets.arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_secrets" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.secrets_policy.arn
}
