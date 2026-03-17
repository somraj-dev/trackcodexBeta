resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "275142546612.dkr.ecr.ap-south-1.amazonaws.com/trackcodex-backend:latest"
      cpu       = 512
      memory    = 1024
      essential = true
      portMappings = [
        {
          containerPort = 4000
          hostPort      = 4000
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "FRONTEND_URL", value = "https://trackcodex.com" },
        { name = "BACKEND_URL", value = "https://api.trackcodex.com" }
      ]
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:DATABASE_URL::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:JWT_SECRET::"
        },
        {
          name      = "ENCRYPTION_KEY"
          valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:ENCRYPTION_KEY::"
        },
        {
          name      = "COOKIE_SECRET"
          valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:COOKIE_SECRET::"
        },
        {
          name      = "GITHUB_CLIENT_ID"
          valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:GITHUB_CLIENT_ID::"
        },
        {
          name      = "GITHUB_CLIENT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:GITHUB_CLIENT_SECRET::"
        },
        {
          name      = "INTEGRATION_GITHUB_CLIENT_ID"
          valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:INTEGRATION_GITHUB_CLIENT_ID::"
        },
        {
          name      = "INTEGRATION_GITHUB_CLIENT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:INTEGRATION_GITHUB_CLIENT_SECRET::"
        },
        {
          name      = "GITLAB_CLIENT_ID"
          valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:GITLAB_CLIENT_ID::"
        },
        {
          name      = "GITLAB_CLIENT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:GITLAB_CLIENT_SECRET::"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project_name}"
          "awslogs-region"        = "ap-south-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}


resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 30
}

resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = aws_subnet.public.*.id
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.app.id
    container_name   = "backend"
    container_port   = 4000
  }

  depends_on = [aws_alb_listener.front_end]
}
