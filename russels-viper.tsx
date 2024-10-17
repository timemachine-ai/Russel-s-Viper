"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'

const CELL_SIZE = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_DIRECTION = { x: 1, y: 0 }

const DIFFICULTIES = {
  hard: { speed: 100, obstacleCount: 10, color: 'text-yellow-400' },
  extreme: { speed: 80, obstacleCount: 15, color: 'text-orange-400' },
  nightmare: { speed: 60, obstacleCount: 20, color: 'text-red-400' }
}

const COLORS = [
  { name: 'Neon Green', value: '#39FF14' },
  { name: 'Electric Blue', value: '#00FFFF' },
  { name: 'Hot Pink', value: '#FF69B4' },
  { name: 'Cyber Yellow', value: '#FFD300' },
  { name: 'Plasma Purple', value: '#8A2BE2' },
]

export default function RusselsViper() {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [direction, setDirection] = useState(INITIAL_DIRECTION)
  const [food, setFood] = useState({ x: 15, y: 15 })
  const [obstacles, setObstacles] = useState<{ x: number; y: number }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState('hard')
  const [snakeColor, setSnakeColor] = useState(COLORS[0].value)
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 })
  const [isPlaying, setIsPlaying] = useState(false)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  const calculateGridSize = useCallback(() => {
    if (gameAreaRef.current) {
      const width = Math.floor(gameAreaRef.current.clientWidth / CELL_SIZE)
      const height = Math.floor(gameAreaRef.current.clientHeight / CELL_SIZE)
      setGridSize({ width, height })
    }
  }, [])

  useEffect(() => {
    calculateGridSize()
    window.addEventListener('resize', calculateGridSize)
    return () => window.removeEventListener('resize', calculateGridSize)
  }, [calculateGridSize])

  const generateFood = useCallback(() => {
    let newFood
    do {
      newFood = {
        x: Math.floor(Math.random() * gridSize.width),
        y: Math.floor(Math.random() * gridSize.height)
      }
    } while (
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      obstacles.some(obstacle => obstacle.x === newFood.x && obstacle.y === newFood.y)
    )
    setFood(newFood)
  }, [gridSize, snake, obstacles])

  const generateObstacles = useCallback(() => {
    const newObstacles = []
    const obstacleCount = DIFFICULTIES[difficulty as keyof typeof DIFFICULTIES].obstacleCount
    for (let i = 0; i < obstacleCount; i++) {
      let obstacle
      do {
        obstacle = {
          x: Math.floor(Math.random() * gridSize.width),
          y: Math.floor(Math.random() * gridSize.height)
        }
      } while (
        snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y) ||
        newObstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y) ||
        (food.x === obstacle.x && food.y === obstacle.y)
      )
      newObstacles.push(obstacle)
    }
    setObstacles(newObstacles)
  }, [difficulty, gridSize, snake, food])

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const newSnake = [...prevSnake]
      const head = { ...newSnake[0] }
      head.x += direction.x
      head.y += direction.y

      // Wrap around logic
      if (head.x < 0) head.x = gridSize.width - 1
      if (head.x >= gridSize.width) head.x = 0
      if (head.y < 0) head.y = gridSize.height - 1
      if (head.y >= gridSize.height) head.y = 0

      // Check collision with obstacles or self
      if (
        obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y) ||
        newSnake.some(segment => segment.x === head.x && segment.y === head.y)
      ) {
        setGameOver(true)
        setIsPlaying(false)
        return prevSnake
      }

      newSnake.unshift(head)

      if (head.x === food.x && head.y === food.y) {
        setScore(prevScore => prevScore + 1)
        generateFood()
        // Add a new obstacle every 5 points
        if (score > 0 && score % 5 === 0) {
          generateObstacles()
        }
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [direction, food, gridSize, obstacles, generateFood, generateObstacles, score])

  useEffect(() => {
    if (!isPlaying) return

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setDirection(prev => prev.y === 0 ? { x: 0, y: -1 } : prev)
          break
        case 'ArrowDown':
          setDirection(prev => prev.y === 0 ? { x: 0, y: 1 } : prev)
          break
        case 'ArrowLeft':
          setDirection(prev => prev.x === 0 ? { x: -1, y: 0 } : prev)
          break
        case 'ArrowRight':
          setDirection(prev => prev.x === 0 ? { x: 1, y: 0 } : prev)
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)

    const gameLoop = setInterval(moveSnake, DIFFICULTIES[difficulty as keyof typeof DIFFICULTIES].speed)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      clearInterval(gameLoop)
    }
  }, [difficulty, isPlaying, moveSnake])

  const startGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    generateFood()
    generateObstacles()
    setGameOver(false)
    setScore(0)
    setIsPlaying(true)
  }

  const pauseGame = () => {
    setIsPlaying(false)
  }

  const resumeGame = () => {
    setIsPlaying(true)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-cyan-300 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] opacity-5 bg-cover bg-center"></div>
      <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 z-10">
        Russel&apos;s Viper
      </h1>
      <div 
        ref={gameAreaRef} 
        className="relative w-full h-[calc(100vh-8rem)] border border-cyan-800 rounded-lg overflow-hidden"
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute rounded-sm"
            style={{
              left: `${segment.x * CELL_SIZE}px`,
              top: `${segment.y * CELL_SIZE}px`,
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              backgroundColor: snakeColor,
              boxShadow: `0 0 5px ${snakeColor}, 0 0 10px ${snakeColor}`
            }}
          />
        ))}
        <div
          className="absolute rounded-full"
          style={{
            left: `${food.x * CELL_SIZE}px`,
            top: `${food.y * CELL_SIZE}px`,
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
            backgroundColor: '#FF00FF',
            boxShadow: '0 0 5px #FF00FF, 0 0 10px #FF00FF'
          }}
        />
        {obstacles.map((obstacle, index) => (
          <div
            key={`obstacle-${index}`}
            className="absolute rounded-sm"
            style={{
              left: `${obstacle.x * CELL_SIZE}px`,
              top: `${obstacle.y * CELL_SIZE}px`,
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              backgroundColor: '#FF0000',
              boxShadow: '0 0 5px #FF0000, 0 0 10px #FF0000'
            }}
          />
        ))}
      </div>
      <div className="mt-2 p-4 bg-gray-900 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-lg border border-cyan-800 z-10">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xl">Score: {score}</p>
          <div className="space-x-2">
            {!isPlaying && !gameOver && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
              >
                Start
              </motion.button>
            )}
            {isPlaying && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={pauseGame}
                className="px-4 py-2 bg-yellow-700 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Pause
              </motion.button>
            )}
            {!isPlaying && !gameOver && score > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resumeGame}
                className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Resume
              </motion.button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {Object.keys(DIFFICULTIES).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`px-3 py-1 rounded ${
                  difficulty === diff ? 'bg-cyan-800' : 'bg-gray-800'
                } hover:bg-cyan-700 transition-colors ${DIFFICULTIES[diff as keyof typeof DIFFICULTIES].color}`}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            {COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => setSnakeColor(color.value)}
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>
      {gameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-20"
        >
          <div className="bg-gray-900 bg-opacity-90 p-8 rounded-lg text-center backdrop-filter backdrop-blur-lg border border-cyan-800">
            <p className="text-3xl mb-4">Game Over!</p>
            <p className="text-xl mb-4">Your score: {score}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-6 py-3 bg-gradient-to-r from-purple-700 to-pink-700 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
            >
              Play Again
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}