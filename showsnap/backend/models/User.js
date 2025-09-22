import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true, // This automatically creates a unique index
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      validate: {
        validator: value =>
          /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/.test(value),
        message: 'Password must contain letters and numbers'
      }
    },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    phone: { type: String, match: [/^\d{10}$/, 'Phone must be 10 digits'], default: '' },
    profileImage: {
      type: String,
      match: [/^https?:\/\/.+\.(jpg|jpeg|png|webp)$/, 'Invalid image URL'],
      default: ''
    },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: [] }],
    resetPasswordToken: { type: String, default: '' },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true, versionKey: false }
);

// ❌ Removed duplicate index that is already created by `unique: true`
// userSchema.index({ email: 1 }, { unique: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;