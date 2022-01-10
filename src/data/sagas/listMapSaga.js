import { takeLatest } from 'redux-saga/effects'
import actionTypes from '../../common/constants/actionTypes'

export function * mapListSaga () {
  console.log('Home loaded!')
}

export function * watchMapList () {
  yield takeLatest(actionTypes.LIST_CLICKED, mapListSaga)
}
