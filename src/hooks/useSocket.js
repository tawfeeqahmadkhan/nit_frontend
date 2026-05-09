import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let socketInstance = null

export function useSocket(handlers = {}) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io({ transports: ['websocket'] })
    }
    const socket = socketInstance

    const entries = Object.entries(handlersRef.current)
    entries.forEach(([event, fn]) => socket.on(event, fn))

    return () => {
      entries.forEach(([event, fn]) => socket.off(event, fn))
    }
  }, [])

  return socketInstance
}
