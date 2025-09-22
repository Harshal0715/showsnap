import sendEmail from './sendEmail.js';

/**
 * Sends a booking confirmation email to the user
 * @param {Object} bookingDetails - Details of the confirmed booking
 * @param {string} bookingDetails.movieTitle - Movie name
 * @param {Object} bookingDetails.theater - Theater details
 * @param {string} bookingDetails.theater.name - Theater name
 * @param {string} bookingDetails.theater.location - Theater location
 * @param {string|Date} bookingDetails.showtimeDate - Showtime date
 * @param {Array<string>} bookingDetails.seats - Selected seat numbers
 * @param {string} bookingDetails.userName - Name of the user
 * @param {string} userEmail - Recipient's email address
 */
export default async function sendBookingEmail(bookingDetails, userEmail) {
  const { movieTitle, theater, showtimeDate, seats, userName } = bookingDetails;

  // 🛡️ Validate input
  if (
    !userEmail ||
    !movieTitle ||
    !theater?.name ||
    !theater?.location ||
    !showtimeDate ||
    !Array.isArray(seats) ||
    seats.length === 0 ||
    !userName
  ) {
    console.error('❌ Missing booking details for email');
    throw new Error('Incomplete booking details');
  }

  // 📅 Format showtime
  const formattedDate = new Date(showtimeDate).toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // 📧 Compose HTML email
  const emailHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #2c3e50;">🎟️ Booking Confirmed</h2>
      <p>Hi ${userName},</p>
      <p>Your booking for <strong>${movieTitle}</strong> is confirmed!</p>
      <ul>
        <li><strong>Theater:</strong> ${theater.name}</li>
        <li><strong>Location:</strong> ${theater.location}</li>
        <li><strong>Showtime:</strong> ${formattedDate}</li>
        <li><strong>Seats:</strong> ${seats.join(', ')}</li>
      </ul>
      <p>Enjoy your movie experience with <strong>ShowSnap</strong> 🍿</p>
      <hr style="margin-top: 20px;" />
      <p style="font-size: 0.9em; color: #7f8c8d;">
        Need help? Contact us at <a href="mailto:support@showsnap.in">support@showsnap.in</a>
      </p>
    </div>
  `;

  // Plain text fallback
  const emailText = `Hi ${userName}, your booking for ${movieTitle} at ${theater.name}, ${theater.location} on ${formattedDate} is confirmed. Seats: ${seats.join(', ')}. Enjoy your movie!`;

  // 🚀 Send email
  try {
    return await sendEmail({
      to: userEmail,
      subject: `🎬 Your ShowSnap Booking for ${movieTitle}`,
      html: emailHTML,
      text: emailText
    });
  } catch (err) {
    console.error(`❌ Failed to send booking email to ${userEmail}: ${err.message}`);
    throw new Error('Booking confirmation email failed');
  }
}
