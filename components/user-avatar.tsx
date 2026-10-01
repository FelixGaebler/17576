import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type UserAvatarProps = {
  displayName: string
  avatarUrl: string | null
  size?: "sm" | "default" | "lg"
  className?: string
}

export function UserAvatar({ displayName, avatarUrl, size, className }: UserAvatarProps) {
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")

  return (
    <Avatar size={size} className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback aria-hidden>{initials}</AvatarFallback>
    </Avatar>
  )
}
