import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createBooking } from './bookingController.js';
import logger from '../utils/logger.js';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

// 🧾 Create Razorpay order
export const createOrder = async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount)) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });
    logger.info(`🧾 Razorpay order created: ${order.id}`);
    res.status(201).json({ orderId: order.id });
  } catch (err) {
    logger.error(`❌ Razorpay order creation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// ✅ Verify Razorpay payment and create booking
export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    movieId,
    seats,
    theater,
    showtimeDate,
    amount
  } = req.body;

  const userId = req.user._id;

  logger.info('🔍 Verifying payment with payload:', JSON.stringify(req.body, null, 2));

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !userId ||
    !movieId ||
    !seats?.length ||
    !theater?.name ||
    !theater?.location ||
    !showtimeDate ||
    !amount
  ) {
    return res.status(400).json({ error: 'Missing or invalid booking data' });
  }

  try {
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      logger.warn('⚠️ Signature mismatch during payment verification');
      return res.status(400).json({ error: 'Invalid signature. Payment verification failed.' });
    }

    const booking = await createBooking({
      userId,
      movieId,
      seats,
      theater,
      showtimeDate,
      amount,
      paymentStatus: 'paid'
    });

    res.status(200).json({
      success: true,
      message: '✅ Payment verified and booking confirmed',
      bookingId: booking._id
    });
  } catch (err) {
    logger.error(`❌ Payment verification error: ${err.message}`);
    res.status(500).json({ error: err.message || 'Server error during payment verification' });
  }
};
