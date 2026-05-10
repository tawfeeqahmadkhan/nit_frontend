import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let socketInstance = null

export function useSocket(handlers = {}, bizId = null) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!socketInstance) {
      const url = import.meta.env.VITE_API_URL || undefined
      socketInstance = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      })
    }
    const socket = socketInstance

    // Join business room now, and re-join after every reconnect
    function joinBiz() {
      if (bizId) socket.emit('join_business', bizId)
    }
    joinBiz()
    socket.on('connect', joinBiz)

    // Register event handlers via wrapper so they always call the latest ref value
    const events = Object.keys(handlersRef.current)
    const wrappers = {}
    events.forEach(event => {
      wrappers[event] = (...args) => handlersRef.current[event]?.(...args)
      socket.on(event, wrappers[event])
    })

    return () => {
      socket.off('connect', joinBiz)
      events.forEach(event => socket.off(event, wrappers[event]))
    }
  }, [bizId])

  return socketInstance
}
