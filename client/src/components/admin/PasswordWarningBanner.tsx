import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface PasswordWarningBannerProps {
  onChangePasswordClick?: () => void;
}

export function PasswordWarningBanner({ onChangePasswordClick }: PasswordWarningBannerProps) {
  // ✅ Sicherheitswarnung deaktiviert - Passwort wurde geändert
  return null;
}