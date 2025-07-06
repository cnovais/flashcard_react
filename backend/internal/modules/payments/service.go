package payments

import (
	"fmt"
	"time"

	"flashcard-backend/internal/config"
	"flashcard-backend/internal/domain/entities"

	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"
	"github.com/stripe/stripe-go/v74/customer"
	"github.com/stripe/stripe-go/v74/subscription"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Service struct {
	cfg *config.Config
}

func NewService(cfg *config.Config) *Service {
	stripe.Key = cfg.Stripe.SecretKey
	return &Service{cfg: cfg}
}

func (s *Service) CreateCheckoutSession(userID string, planID string, successURL, cancelURL string) (*stripe.CheckoutSession, error) {
	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: stripe.StringSlice([]string{
			"card",
		}),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(planID),
				Quantity: stripe.Int64(1),
			},
		},
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
		Metadata: map[string]string{
			"user_id": userID,
		},
	}

	return session.New(params)
}

func (s *Service) CreateCustomer(user *entities.User) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		Email: stripe.String(user.Email),
		Name:  stripe.String(user.Name),
		Metadata: map[string]string{
			"user_id": user.ID.Hex(),
		},
	}

	return customer.New(params)
}

func (s *Service) GetSubscription(subscriptionID string) (*stripe.Subscription, error) {
	return subscription.Get(subscriptionID, nil)
}

func (s *Service) CancelSubscription(subscriptionID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		CancelAtPeriodEnd: stripe.Bool(true),
	}

	return subscription.Update(subscriptionID, params)
}

func (s *Service) ReactivateSubscription(subscriptionID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		CancelAtPeriodEnd: stripe.Bool(false),
	}

	return subscription.Update(subscriptionID, params)
}

func (s *Service) CreatePaymentIntent(amount int64, currency string, userID string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amount),
		Currency: stripe.String(currency),
		Metadata: map[string]string{
			"user_id": userID,
		},
	}

	return stripe.NewPaymentIntent(params)
}

func (s *Service) HandleWebhook(payload []byte, signature string) (*stripe.Event, error) {
	event, err := stripe.ConstructEvent(payload, signature, s.cfg.Stripe.WebhookSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to construct event: %w", err)
	}

	return &event, nil
}

func (s *Service) ProcessSubscriptionCreated(event *stripe.Event) error {
	var subscription stripe.Subscription
	err := stripe.Unmarshal(event.Data.Raw, &subscription)
	if err != nil {
		return fmt.Errorf("failed to unmarshal subscription: %w", err)
	}

	// Get user ID from metadata
	userID := subscription.Metadata["user_id"]
	if userID == "" {
		return fmt.Errorf("no user_id in subscription metadata")
	}

	// Update user plan in database
	// This would typically be done by calling the plans service
	// For now, we'll just log it
	fmt.Printf("Subscription created for user %s: %s\n", userID, subscription.ID)

	return nil
}

func (s *Service) ProcessSubscriptionDeleted(event *stripe.Event) error {
	var subscription stripe.Subscription
	err := stripe.Unmarshal(event.Data.Raw, &subscription)
	if err != nil {
		return fmt.Errorf("failed to unmarshal subscription: %w", err)
	}

	// Get user ID from metadata
	userID := subscription.Metadata["user_id"]
	if userID == "" {
		return fmt.Errorf("no user_id in subscription metadata")
	}

	// Downgrade user to free plan
	// This would typically be done by calling the plans service
	fmt.Printf("Subscription cancelled for user %s: %s\n", userID, subscription.ID)

	return nil
} 