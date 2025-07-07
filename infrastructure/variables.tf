variable "key_name" {
  description = "Nome do par de chaves SSH para acessar a EC2"
  type        = string
  default     = "flashcard-key"
}

variable "public_key_path" {
  description = "Caminho para sua chave pública SSH"
  type        = string
  default     = "/Users/cleiton/.ssh/id_rsa.pub"
}