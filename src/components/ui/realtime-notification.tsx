import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const notificationVariants = cva(
  "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 transform z-50 flex items-center gap-3",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-900 border border-gray-200",
        primary: "bg-primary text-primary-foreground",
        success: "bg-green-600 text-white",
        warning: "bg-yellow-500 text-white",
        destructive: "bg-red-600 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface RealtimeNotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  message: string;
  duration?: number;
  onClose?: () => void;
  icon?: React.ReactNode;
  visible: boolean;
}

export function RealtimeNotification({
  className,
  variant,
  message,
  duration = 5000,
  onClose,
  icon,
  visible,
  ...props
}: RealtimeNotificationProps) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        notificationVariants({ variant }),
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
        className
      )}
      {...props}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-grow">{message}</div>
      <button
        onClick={() => {
          setIsVisible(false);
          if (onClose) onClose();
        }}
        className="flex-shrink-0 p-1 rounded-full hover:bg-black/10"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export interface RealtimeNotificationManagerProps {
  notifications: Array<{
    id: string;
    message: string;
    variant?: "default" | "primary" | "success" | "warning" | "destructive";
    icon?: React.ReactNode;
  }>;
  onClose: (id: string) => void;
}

export function RealtimeNotificationManager({
  notifications,
  onClose,
}: RealtimeNotificationManagerProps) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {notifications.map((notification, index) => (
        <RealtimeNotification
          key={notification.id}
          message={notification.message}
          variant={notification.variant}
          icon={notification.icon}
          visible={true}
          style={{ 
            bottom: `${(notifications.length - 1 - index) * 4 + 1}rem`,
            zIndex: 50 - index
          }}
          onClose={() => onClose(notification.id)}
        />
      ))}
    </div>
  );
} 