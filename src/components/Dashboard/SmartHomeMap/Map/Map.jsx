import React, { useState, useEffect, useRef } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useDispatch, useSelector } from 'react-redux'
import sensorsInfo from '../../../../common/constants/sensorsInfo'
import { onMapClick } from '../../../../data/actions/mapListCommunicationActions.js'
import house from '../../../../common/assets/house.svg'
import Sensor from '../../../../components/Dashboard/SmartHomeMap/Map/Sensor'
import MapModal from '../../../../components/Dashboard/SmartHomeMap/Map/MapModal'
import { loadSensors, updateSensors } from '../../../../data/actions/sensor/sensorActions.js'
import { dbAddPoint, dbUpdateAddErrorPoints, dbUpdateRemoveErrorPoints } from '../../../../data/actions/dbActions.js'
import {
  fromCoordinateToPercentMapper,
  fromPercentToCoordinateMapper,
  isFieldOccupied,
  validPointData
} from './helpers'
import { useTranslation } from 'react-i18next'

import { useSnackbar } from 'notistack'

/** Defines how many times sensor is smaller than map. */
const SENSOR_COEFFICIENT = 20

const useStyles = makeStyles((props) => ({
  container: {
    position: 'relative'
  },
  image: props => ({
    cursor: props.mapDisabled
      ? 'cell'
      : props.pointPressed ? 'pointer' : 'not-allowed',
    height: 'auto',
    width: 'auto',
    minWidth: '100%',
    maxHeight: 'calc(100vh - 150px)'
  })
}))

const newMapSensors = (nonMappedSensors, _id) => {
  return Object.values(nonMappedSensors).map((sensorGroup) => (sensorGroup.map((sensor) => {
    sensor.id === _id && delete sensor.mapPosition
    return sensor
  })))
}

const HomeMap = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const picRef = useRef(null)

  const [mapHeight, setMapHeight] = useState(null)
  const [mapWidth, setMapWidth] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isMapReady, setMapReady] = useState(false)

  const { enqueueSnackbar } = useSnackbar()

  const nonMappedSensors = useSelector((state) => state.sensor.sensors)
  const mapListCommunication = useSelector((state) => state.mapListCommunication)
  const { _id, addError, addErrorPoints, removeSuccess, removeErrorPoints } = useSelector((state) => state.dbInteraction)

  /**
   * Transfroms sensors from store to appropriate format.
   *
   * @returns {Array} array od sensors objects: { x: number, y: number }
   */
  const sensors = useSelector((state) => {
    const { sensors } = state.sensor
    return Object.keys(sensors).map(key => sensors[key]).flat().filter(sensor => sensor.mapPosition)
  })

  const checkListSensorClicked = () => sensors.filter(s => s.id === mapListCommunication.pressedItemId).length === 1

  const classes = useStyles({
    mapDisabled:
      mapListCommunication.waitingForSensorLocation,
    pointPressed: mapListCommunication.mapPointPressed || checkListSensorClicked()
  })

  useEffect(() => {
    return () => {
      dispatch(loadSensors())
    }
  }, [dispatch])

  useEffect(() => {
    if (addError !== undefined) {
      addErrorPoints.forEach(p => {
        enqueueSnackbar(t('dashboard:sensor-add-failed', { id: p }), {
          variant: 'error'
        })
        dispatch(dbUpdateAddErrorPoints(p))
      })

      const newSensors = Object.values(nonMappedSensors).map((sensorGroup) => (sensorGroup.map((sensor) => {
        addErrorPoints.includes(sensor.id) && delete sensor.mapPosition
        return sensor
      })))
      dispatch(updateSensors(newSensors))
    }
  }, [addError])

  useEffect(() => {
    if (removeSuccess && removeErrorPoints.length !== 0) {
      const newSensors = newMapSensors(nonMappedSensors, _id)
      dispatch(updateSensors(newSensors))
      dispatch(dbUpdateRemoveErrorPoints(_id))
    }
  }, [removeSuccess])

  useEffect(() => {
    function handleResize () {
      if (picRef !== null && picRef.current !== null) {
        const { height, width } = picRef.current
        setMapHeight(height)
        setMapWidth(width)
        setMapReady(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /**
  * Adds point to array if possible.
  *
  * @param e Mouse click event.
  */
  const addNewSensor = (e) => {
    if (mapListCommunication.mapPointPressed || checkListSensorClicked()) {
      dispatch(onMapClick())
    }
    if (!mapListCommunication.waitingForSensorLocation) {
      return
    }

    const { offsetX = 0, offsetY = 0 } = e.nativeEvent

    /** Offset defined in map's width in percent. */
    const xCoordinate = fromCoordinateToPercentMapper(offsetX, mapWidth)
    /** Offset defined in map's height in percent. */
    const yCoordinate = fromCoordinateToPercentMapper(offsetY, mapHeight)
    /** Sensors fetched from store and mapper to appropriate format. */

    const storeSensors = sensors
      .map((sensor) => Object.assign(sensor, { x: sensor.mapPosition.x, y: sensor.mapPosition.y }))

    /** Checks if point could be located in specific position on map. */
    if (isFieldOccupied(xCoordinate, yCoordinate, storeSensors)) {
      setModalOpen(true)
      return
    }

    dispatch(onMapClick())

    let clickedSensor
    const newSensors = Object.values(nonMappedSensors).map((sensorGroup) => (
      sensorGroup.map((sensor) => {
        if (sensor.id === mapListCommunication.sensorData.id && sensor.type === mapListCommunication.sensorData.type) {
          clickedSensor = sensor
          return { ...sensor, mapPosition: { x: xCoordinate, y: yCoordinate } }
        }
        return sensor
      })
    ))

    dispatch(updateSensors(newSensors))
    dispatch(dbAddPoint({ _id: clickedSensor.id, type: clickedSensor.type, mapPosition: { x: xCoordinate, y: yCoordinate } }))
  }

  /** Function sets starting map size after image loading. **/
  function setOnLoadMapSize () {
    const { height, width } = picRef.current
    setMapReady(true)
    setMapHeight(height)
    setMapWidth(width)
  }

  return (
    <div className={classes.container}>
      <img
        data-testid='image-id'
        ref={picRef}
        onClick={addNewSensor}
        src={house}
        alt='Home plan'
        className={classes.image}
        onLoad={setOnLoadMapSize}
      />
      {
        isMapReady ? sensors
          .map((point) => (
            validPointData(point) &&
              <Sensor
                sensorData={point}
                data-testid='sensor-id'
                key={point.id}
                sensorSize={
                  { width: Math.round(mapHeight / SENSOR_COEFFICIENT), height: Math.round(mapHeight / SENSOR_COEFFICIENT) }
                }
                position={{
                  top: fromPercentToCoordinateMapper(point.mapPosition.y, mapHeight) - Math.round(mapHeight / SENSOR_COEFFICIENT) / 2,
                  left: fromPercentToCoordinateMapper(point.mapPosition.x, mapWidth) - Math.round(mapHeight / SENSOR_COEFFICIENT) / 2,
                  position: 'absolute'
                }}
                sensorColor={'black' && sensorsInfo[point.type] && sensorsInfo[point.type].color}
              />
          ))
          : null
      }

      <MapModal
        data-testid='modal-test-id'
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('dashboard:map-modal-title')}
        content={t('dashboard:map-modal-content')}
      />
    </div>
  )
}

export default HomeMap
