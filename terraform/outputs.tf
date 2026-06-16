output "alb_dns_name" {
  description = "DNS del Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "cloudfront_domain" {
  description = "Dominio de CloudFront"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "aurora_endpoint" {
  description = "Endpoint del cluster Aurora"
  value       = aws_rds_cluster.aurora.endpoint
  sensitive   = true
}

output "aurora_reader_endpoint" {
  description = "Endpoint de lectura del cluster Aurora"
  value       = aws_rds_cluster.aurora.reader_endpoint
  sensitive   = true
}

output "ec2_public_ip" {
  description = "IP pública de la instancia EC2"
  value       = aws_instance.app.public_ip
}

output "backup_bucket" {
  description = "Bucket S3 para backups"
  value       = aws_s3_bucket.backups.bucket
}
