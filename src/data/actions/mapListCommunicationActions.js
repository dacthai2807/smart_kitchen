import actionTypes from '../../common/constants/actionTypes'

/**
 * Returns action after list click.
 *
 * @param {string} id         sensor id
 * @param {string} color      color in hex
 * @param {string} sensorData sensor info
 * @returns Action for mapListCommunication reducer.
 */
export function onListClick (id, color, sensorData, isOnMap) {
  return {
    type: actionTypes.LIST_CLICKED,
    id,
    sensorColor: color,
    sensorData,
    isOnMap
  }
}

/**
 * Returns action after map click.
 *
 * @returns Action for mapListCommunication reducer.
 */
export function onMapClick () {
  return {
    type: actionTypes.MAP_CLICKED
  }
}

export function onPointClick (id, sensorBorderColor) {
  return {
    type: actionTypes.POINT_CLICKED,
    id,
    sensorBorderColor: sensorBorderColor
  }
}
