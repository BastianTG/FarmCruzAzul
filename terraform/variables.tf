variable "aws_region" {
  description = "Región AWS"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Entorno"
  type        = string
  default     = "produccion"
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "cruzazul-erp"
}

variable "db_master_username" {
  description = "Usuario master de la base de datos"
  type        = string
  default     = "admin"
}

variable "db_master_password" {
  description = "Contraseña master de la base de datos"
  type        = string
  sensitive   = true
}

variable "ec2_instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t3.medium"
}

variable "allowed_cidr_blocks" {
  description = "Bloques CIDR permitidos para acceso SSH/HTTP"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "domain_name" {
  description = "Nombre de dominio para CloudFront"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ARN del certificado ACM en us-east-1 para CloudFront"
  type        = string
  default     = ""
}
