// src/lib/storage/quiz-storage.ts

/**
 * Simple Quiz Storage Manager
 * Uses localStorage to persist in-progress quiz attempts
 */

import type { QuizAnswers } from '@/types/quiz'

interface StoredAttempt {
  quizId: number
  answers: QuizAnswers
  timestamp: string
}

const STORAGE_KEY = 'quiz_attempts'

/**
 * Save quiz answers to localStorage
 */
export function saveQuizAttempt(
  noteId: number,
  quizId: number,
  answers: QuizAnswers
): void {
  try {
    const key = `${STORAGE_KEY}_${noteId}_${quizId}`
    const data: StoredAttempt = {
      quizId,
      answers,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save quiz attempt:', error)
  }
}

/**
 * Load quiz answers from localStorage
 */
export function loadQuizAttempt(
  noteId: number,
  quizId: number
): QuizAnswers | null {
  try {
    const key = `${STORAGE_KEY}_${noteId}_${quizId}`
    const stored = localStorage.getItem(key)

    if (!stored) return null

    const data: StoredAttempt = JSON.parse(stored)
    return data.answers
  } catch (error) {
    console.error('Failed to load quiz attempt:', error)
    return null
  }
}

/**
 * Remove quiz attempt from localStorage
 */
export function removeQuizAttempt(
  noteId: number,
  quizId: number
): void {
  try {
    const key = `${STORAGE_KEY}_${noteId}_${quizId}`
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove quiz attempt:', error)
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}