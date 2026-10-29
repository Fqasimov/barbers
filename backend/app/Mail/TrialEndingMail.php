<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class TrialEndingMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $salonName, public int $daysLeft, public string $endsOn, public string $hiddenOn) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->daysLeft > 0
            ? "Usta: sınaq {$this->daysLeft} günə bitir / пробный период заканчивается через {$this->daysLeft} дн. / trial ends in {$this->daysLeft} days"
            : 'Usta: sınaq müddəti bu gün bitir / пробный период заканчивается сегодня / trial ends today');
    }

    public function content(): Content
    {
        return new Content(text: 'mail.trial-ending');
    }
}
