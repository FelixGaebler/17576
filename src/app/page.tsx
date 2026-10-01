
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <Progress value={56} className="w-full max-w-sm">
        <ProgressLabel>Upload progress</ProgressLabel>
        <ProgressValue />
      </Progress>
      <InputOTP maxLength={3} pattern="^[A-Z]+$">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
      </InputOTP>
    </main>
  )
}
