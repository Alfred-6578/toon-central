import type { IconType } from "react-icons";
import { IoBookOutline, IoChatbubbleOutline, IoDiamondOutline, IoHandRightOutline, IoTrophyOutline } from "react-icons/io5";
import type { NotificationKind } from "@/lib/notifications";

// How each kind looks everywhere it appears (bell, list, pop-up, reading page).
export const KIND_STYLE: Record<NotificationKind, { icon: IconType; label: string; color: string }> = {
  welcome: { icon: IoHandRightOutline, label: "Welcome", color: "bg-mint" },
  milestone: { icon: IoTrophyOutline, label: "Congratulations", color: "bg-sun" },
  episode: { icon: IoBookOutline, label: "New episode", color: "bg-mint" },
  reply: { icon: IoChatbubbleOutline, label: "Reply", color: "bg-paper" },
  account: { icon: IoDiamondOutline, label: "Account", color: "bg-paper" },
};

export const notificationHref = (id: string) => `/notifications/${id}`;
