// Runs before any store is created: the stores read the remembered account
// when they build their storage keys, so dev parameters must land first.
import { applyDevParams } from './devSeed'

applyDevParams()
