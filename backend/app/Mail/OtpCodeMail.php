<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** The six-digit code. Text only, no link. */
class OtpCodeMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $code, public string $purpose) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Usta: {$this->code}");
    }

    public function content(): Content
    {
        return new Content(text: 'mail.otp');
    }
}
