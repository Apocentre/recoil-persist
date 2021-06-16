'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.recoilPersist = void 0
const recoil_1 = require('recoil')
/**
 * Recoil module to persist state to storage
 *
 * @param config Optional configuration object
 * @param config.key Used as key in local storage, defaults to `recoil-persist`
 * @param config.storage Local storage to use, defaults to `localStorage`
 */
const recoilPersist = (config = {}) => {
  if (typeof window === 'undefined') {
    return {
      persistAtom: () => {},
    }
  }
  const { key = 'recoil-persist', storage = localStorage, ttl = -1 } = config
  const persistAtom = ({ onSet, node, trigger, setSelf }) => {
    if (trigger === 'get') {
      const state = getState()
      if (typeof state.then === 'function') {
        state.then((s) => {
          if (s.hasOwnProperty(node.key)) {
            setSelf(s[node.key])
          }
        })
      }
      if (state.hasOwnProperty(node.key)) {
        setSelf(state[node.key])
      }
    }
    onSet(async (newValue) => {
      const state = getState()
      if (typeof state.then === 'function') {
        state.then((s) => updateState(newValue, s, node.key))
      } else {
        updateState(newValue, state, node.key)
      }
    })
  }
  const updateState = (newValue, state, key) => {
    if (
      newValue !== null &&
      newValue !== undefined &&
      newValue instanceof recoil_1.DefaultValue &&
      state.hasOwnProperty(key)
    ) {
      delete state[key]
    } else {
      state[key] = newValue
    }
    setState(state)
  }
  const getState = () => {
    const toParse = storage.getItem(key)
    if (toParse === null || toParse === undefined) {
      return {}
    }
    if (typeof toParse === 'string') {
      return parseState(toParse)
    }
    if (typeof toParse.then === 'function') {
      return toParse.then(parseState)
    }
    return {}
  }
  const parseState = (state) => {
    if (state === undefined) {
      return {}
    }
    try {
      const { data, expire } = JSON.parse(state)
      const now = Date.now()
      if (expire > now) {
        return data
      }
      return {}
    } catch (e) {
      console.error(e)
      return {}
    }
  }
  const setState = (state) => {
    try {
      const now = Date.now()
      const expire = ttl > 0 ? now + ttl : Number.MAX_SAFE_INTEGER
      if (typeof storage.mergeItem === 'function') {
        storage.mergeItem(key, JSON.stringify({ data: state, expire }))
      } else {
        storage.setItem(key, JSON.stringify({ data: state, expire }))
      }
    } catch (e) {
      console.error(e)
    }
  }
  return { persistAtom }
}
exports.recoilPersist = recoilPersist
