resource "aws_secretsmanager_secret" "backend_secrets" {
  name = "${var.project_name}-backend-secrets-new"
}

resource "aws_secretsmanager_secret_version" "backend_secrets_version" {
  secret_id     = aws_secretsmanager_secret.backend_secrets.id
  secret_string = jsonencode({
    DATABASE_URL   = "postgresql://${aws_db_instance.main.username}:${aws_db_instance.main.password}@${aws_db_instance.main.endpoint}/trackcodex_db"
    JWT_SECRET     = "super-secret-key-change-this-in-production"
    ENCRYPTION_KEY = "e0f54592-d6c4-4b47-8178-5e5898394236"
    COOKIE_SECRET  = "cookie-secret-change-this-min-32-chars"
    
    # GitHub Auth (Old)
    GITHUB_CLIENT_ID     = "Ov23licToDxyo4YGzpOj"
    GITHUB_CLIENT_SECRET = "5a277a02609fffc44463d04c549bfd0bd8920834"

    # GitHub Integration (New)
    INTEGRATION_GITHUB_CLIENT_ID     = "Ov23liO3PrmxXbPvp4rJ"
    INTEGRATION_GITHUB_CLIENT_SECRET = "d080f9b2a162a8008de984c08db55fe8da4c1ed6"

    # GitLab Integration
    GITLAB_CLIENT_ID     = "your-gitlab-client-id"
    GITLAB_CLIENT_SECRET = "your-gitlab-client-secret"
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
