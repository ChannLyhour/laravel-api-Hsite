import { useState } from 'react'

type CounterButtonProps = {
  className?: string
}

export function CounterButton({ className }: CounterButtonProps) {
  const [count, setCount] = useState(0)

  return (
    <button
      type="button"
      className={className}
      onClick={() => setCount((currentCount) => currentCount + 1)}
    >
      Count is {count}
    </button>
  )
}
