export interface Bike {
  id: number;
  name: string;
  brand: string;
  category: string;
  engine_cc: number;
  year: number;
  transmission: string;
  price_per_day: number;
  plate_number: string;
  status: 'available' | 'rented' | 'maintenance';
  image_url: string;
  features: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id?: number;
  booking_code?: string;
  bike_id: number;
  bike?: Bike;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_id_card: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  pickup_location?: string;
  return_location?: string;
  delivery_address?: string;
  extra_helmets?: number;
  raincoat_count?: number;
  phone_holder?: boolean;
  total_price: number;
  payment_status?: 'unpaid' | 'paid' | 'refunded';
  booking_status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  payment_method?: string;
  notes?: string;
  created_at?: string;
}

export interface DashboardStats {
  total_bikes: number;
  available_bikes: number;
  rented_bikes: number;
  maintenance_bikes: number;
  total_bookings: number;
  active_bookings: number;
  pending_bookings: number;
  total_revenue: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface CalendarData {
  success: boolean;
  bike_id: string;
  month: string;
  booked_dates: Record<string, string>; // date -> booking status
}
