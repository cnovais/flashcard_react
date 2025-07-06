package upload

import (
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"flashcard-backend/internal/config"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/google/uuid"
)

type Service struct {
	s3Client *s3.S3
	bucket   string
	cfg      *config.Config
}

func NewService(cfg *config.Config) *Service {
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String(cfg.AWS.Region),
		Credentials: credentials.NewStaticCredentials(cfg.AWS.AccessKeyID, cfg.AWS.SecretAccessKey, ""),
	})
	if err != nil {
		panic(fmt.Sprintf("Failed to create AWS session: %v", err))
	}

	return &Service{
		s3Client: s3.New(sess),
		bucket:   cfg.AWS.S3Bucket,
		cfg:      cfg,
	}
}

func (s *Service) UploadFile(file *multipart.FileHeader, folder string) (string, error) {
	// Validate file type
	if err := s.validateFileType(file); err != nil {
		return "", err
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s/%s-%s%s", folder, uuid.New().String(), time.Now().Format("20060102-150405"), ext)

	// Open file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	// Upload to S3
	_, err = s.s3Client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(filename),
		Body:        src,
		ContentType: aws.String(file.Header.Get("Content-Type")),
		ACL:         aws.String("public-read"),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload to S3: %w", err)
	}

	// Return public URL
	url := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucket, s.cfg.AWS.Region, filename)
	return url, nil
}

func (s *Service) DeleteFile(url string) error {
	// Extract key from URL
	key := strings.TrimPrefix(url, fmt.Sprintf("https://%s.s3.%s.amazonaws.com/", s.bucket, s.cfg.AWS.Region))

	_, err := s.s3Client.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete from S3: %w", err)
	}

	return nil
}

func (s *Service) validateFileType(file *multipart.FileHeader) error {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	contentType := file.Header.Get("Content-Type")

	// Allowed image types
	allowedImageExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	allowedImageTypes := []string{"image/jpeg", "image/png", "image/gif", "image/webp"}

	// Allowed audio types
	allowedAudioExts := []string{".mp3", ".wav", ".m4a", ".aac"}
	allowedAudioTypes := []string{"audio/mpeg", "audio/wav", "audio/mp4", "audio/aac"}

	// Check if it's an image
	for _, allowedExt := range allowedImageExts {
		if ext == allowedExt {
			for _, allowedType := range allowedImageTypes {
				if contentType == allowedType {
					return nil
				}
			}
		}
	}

	// Check if it's an audio file
	for _, allowedExt := range allowedAudioExts {
		if ext == allowedExt {
			for _, allowedType := range allowedAudioTypes {
				if contentType == allowedType {
					return nil
				}
			}
		}
	}

	return fmt.Errorf("unsupported file type: %s (%s)", ext, contentType)
} 