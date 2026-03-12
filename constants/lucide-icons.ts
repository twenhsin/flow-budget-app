export const LUCIDE_ICON_GROUPS: Record<string, string[]> = {
  飲食類: ['Utensils', 'UtensilsCrossed', 'Coffee', 'CupSoda', 'Pizza', 'Sandwich', 'Salad', 'Soup', 'IceCream', 'Cake', 'Wine', 'Beer', 'Milk', 'Apple', 'ShoppingBasket', 'ChefHat', 'Flame', 'Cookie'],
  交通類: ['Car', 'Bus', 'Train', 'TrainFront', 'Plane', 'Bike', 'Truck', 'Ship', 'Fuel', 'ParkingCircle', 'MapPin', 'Navigation', 'Compass', 'Taxi'],
  購物類: ['ShoppingBag', 'ShoppingCart', 'Store', 'Tag', 'Shirt', 'Watch', 'Gem', 'Package', 'Gift', 'Barcode', 'Scan', 'CreditCard', 'Receipt', 'Wallet'],
  居家類: ['House', 'Building', 'Sofa', 'Lamp', 'Wrench', 'Hammer', 'Plug', 'Wifi', 'Phone', 'Tv', 'Refrigerator', 'WashingMachine', 'BedDouble', 'DoorOpen', 'Key', 'Warehouse'],
  健康類: ['Heart', 'HeartPulse', 'Stethoscope', 'Pill', 'Syringe', 'Thermometer', 'Dumbbell', 'Activity', 'Brain', 'Eye', 'Microscope', 'Bandage', 'Hospital'],
  美容類: ['Scissors', 'Sparkles', 'Star', 'Wand2', 'Droplets', 'Flower2', 'Brush', 'Palette', 'Smile', 'ScanFace'],
  娛樂類: ['Gamepad2', 'Music', 'Headphones', 'Tv2', 'Film', 'Ticket', 'Trophy', 'Dice1', 'Drama', 'Theater', 'Mic', 'Radio', 'PartyPopper', 'Clapperboard'],
  社交類: ['Users', 'UserPlus', 'MessageCircle', 'Heart', 'HandHeart', 'Handshake', 'CalendarHeart', 'PartyPopper', 'Gift', 'Crown'],
  教育類: ['GraduationCap', 'Book', 'BookOpen', 'Library', 'PenLine', 'Pencil', 'Calculator', 'Globe', 'Lightbulb', 'FlaskConical', 'Microscope', 'Presentation', 'School'],
  寵物類: ['PawPrint', 'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Bone', 'House', 'Syringe', 'Scissors'],
  旅遊類: ['Plane', 'Map', 'MapPin', 'Compass', 'Mountain', 'Tent', 'Luggage', 'Camera', 'Binoculars', 'Globe', 'Sunrise', 'Hotel', 'Backpack'],
  金融類: ['Wallet', 'CreditCard', 'Banknote', 'PiggyBank', 'TrendingUp', 'TrendingDown', 'DollarSign', 'Receipt', 'BarChart2', 'Shield', 'Lock'],
  '3C類': ['Smartphone', 'Laptop', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Cpu', 'HardDrive', 'Usb', 'Gamepad2', 'Watch', 'Camera', 'Tv', 'Headphones'],
  通訊類: ['Phone', 'MessageCircle', 'MessageSquare', 'Mail', 'Wifi', 'Bluetooth', 'Radio', 'Signal', 'PhoneCall', 'PhoneIncoming', 'Video', 'AtSign'],
  其他: ['MoreHorizontal', 'HelpCircle', 'Inbox', 'Archive', 'Bookmark', 'Flag', 'Bell', 'AlertCircle', 'CircleDot', 'Layers'],
}

export const ALL_LUCIDE_ICONS = [...new Set(Object.values(LUCIDE_ICON_GROUPS).flat())]
