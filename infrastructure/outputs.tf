output "ec2_public_ip" {
  value = aws_instance.backend.public_ip
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.backend_cdn.domain_name
} 