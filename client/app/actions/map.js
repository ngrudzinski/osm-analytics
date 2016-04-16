import { createAction } from 'redux-actions'

export const enableFilter = createAction('enable filter')
export const disableFilter = createAction('disable filter')
export const setFiltersFromUrl = createAction('set filters from url')
export const setRegion = createAction('set region')
export const setRegionFromUrl = createAction('set region from url')
export const setOverlay = createAction('set overlay')
export const setOverlayFromUrl = createAction('set overlay from url')
export const setView = createAction('set view')
export const setViewFromUrl = createAction('set view from url')
export const setTimes = createAction('set times')
export const setTimesFromUrl = createAction('set times from url')
