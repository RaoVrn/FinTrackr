import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxLength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [6, 'Password must be at least 6 characters']
    },
    avatar: {
      type: String,
      default: function() {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name || 'User')}&background=6366f1&color=fff`;
      },
    },
    // Profile completion fields
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[1-9][\d\s\-()]{7,15}$/, 'Please enter a valid phone number']
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          return v < new Date(); // Must be in the past
        },
        message: 'Date of birth must be in the past'
      }
    },
    occupation: {
      type: String,
      trim: true,
      maxLength: [100, 'Occupation cannot exceed 100 characters']
    },
    address: {
      street: { type: String, trim: true, maxLength: [200, 'Street cannot exceed 200 characters'] },
      city: { type: String, trim: true, maxLength: [100, 'City cannot exceed 100 characters'] },
      state: { type: String, trim: true, maxLength: [100, 'State cannot exceed 100 characters'] },
      zipCode: { type: String, trim: true, maxLength: [20, 'Zip code cannot exceed 20 characters'] },
      country: { type: String, trim: true, maxLength: [100, 'Country cannot exceed 100 characters'] }
    },
    monthlyIncome: {
      type: Number,
      min: [0, 'Monthly income cannot be negative']
    },
    // Profile image URL
    profileImage: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Profile image must be a valid URL'
      }
    },
    // Profile completion tracking
    profileCompletionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // Settings and preferences
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD']
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date
    }
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Virtual for full address
UserSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr) return '';
  
  const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean);
  return parts.join(', ');
});

// Virtual for initials
UserSchema.virtual('initials').get(function() {
  if (!this.name) return 'U';
  return this.name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
});

// Virtual for profile completion percentage
UserSchema.virtual('completionPercentage').get(function() {
  let completed = 0;
  const total = 8; // Total number of profile fields to check
  
  // Basic info (2 points - name and email are required)
  if (this.name) completed += 1;
  if (this.email) completed += 1;
  
  // Contact details (2 points)
  if (this.phone) completed += 1;
  if (this.address && (this.address.street || this.address.city)) completed += 1;
  
  // Financial info (2 points)
  if (this.monthlyIncome && this.monthlyIncome > 0) completed += 1;
  if (this.occupation) completed += 1;
  
  // Additional info (2 points)
  if (this.dateOfBirth) completed += 1;
  if (this.profileImage) completed += 1;
  
  return Math.round((completed / total) * 100);
});

// Method to update profile completion score
UserSchema.methods.updateProfileCompletion = function() {
  this.profileCompletionScore = this.completionPercentage;
  return this.save();
};

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate avatar URL
UserSchema.methods.generateAvatar = function() {
  const name = encodeURIComponent(this.name || 'User');
  return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff&size=200`;
};

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update avatar and completion score
UserSchema.pre('save', function(next) {
  // Update avatar if name changed and no profile image is set
  if (this.isModified('name') && !this.profileImage) {
    this.avatar = this.generateAvatar();
  }
  
  // Update profile completion score
  this.profileCompletionScore = this.completionPercentage;
  
  next();
});

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ isActive: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);