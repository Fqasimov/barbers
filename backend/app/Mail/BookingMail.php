<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** kind: created (to the salon) | cancelled_by_salon (to the customer). */
class BookingMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking, public string $kind, public array $lines)
    {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        $subject = $this->kind === 'created'
            ? 'Usta: yeni bron / новая запись / new booking'
            : 'Usta: bron ləğv edildi / запись отменена / booking cancelled';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(text: 'mail.booking');
    }
}
