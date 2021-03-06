import React, { useState, useEffect } from 'react'
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Grid from '@material-ui/core/Grid'
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { changeStoveSensorDetails } from '../../../../data/actions/sensor'

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%"
  },

  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    '& > *': {
      margin: theme.spacing(1)
    },
  },

  textBox: {
    margin: "9%",
    width: "100%",
    height: 50,
    display: "flex",
    justifyContent: "center",
    borderRadius: "2%",
    border: "1px solid #C4C4C4",
    alignItems: "center",
    fontSize: 20,
    fontFamily: "Arial"
  }
}))

const temperatureLevel = [0, 60, 80, 120, 150, 180, 220, 270, 300]
const wattLevel = [0, 500, 800, 1000, 1300, 1600, 1900, 2100, 2400]

export default function StoveItemInfo ({ sensorData, handleChangeExpanded }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [timer, setTimer] = useState(sensorData.timer)
  const [temperature, setTemperature] = useState(sensorData.temperature)
  const [watt, setWatt] = useState(sensorData.watt)
  const [uptime, setUptime] = useState(sensorData.uptime)
  const [power, setPower] = useState(sensorData.power)
  const [level, setLevel] = useState(sensorData.level)
  const [mode, setMode] = useState(sensorData.mode)
  const [overheat, setOverheat] = useState(sensorData.overheat)
  const [originalSensorData, setOriginalSensorData] = useState(sensorData)
  const [radioValue, setRadioValue] = useState("°C")
  const classes = useStyles()

  useEffect(() => {
    const hasSensorDataChanged = 
      sensorData.power !== originalSensorData.power ||
      sensorData.level !== originalSensorData.level ||
      sensorData.mode !== originalSensorData.mode

    if (hasSensorDataChanged) {
      setPower(sensorData.power)
      setLevel(sensorData.level)
      setMode(sensorData.mode)
      setOriginalSensorData(sensorData)
    }
  })

  const dispatchStoveDetailsChangePower = () => {
    const stoveSensorDetails = {
      id: sensorData.id,
      sensorType: sensorData.type,
      timer: timer,
      temperature: temperature,
      watt: watt,
      uptime: uptime, 
      power: !power,
      level: 7,
      mode: "Hot Pot",
      overheat: overheat
    }
    dispatch(changeStoveSensorDetails(stoveSensorDetails))
  }

  const dispatchStoveDetailsChangeLevel = (amount) => {
    const stoveSensorDetails = {
      id: sensorData.id,
      sensorType: sensorData.type,
      timer: timer,
      temperature: temperature,
      watt: watt,
      uptime: uptime, 
      power: power,
      level: level + amount,
      mode: mode,
      overheat: overheat
    }
    dispatch(changeStoveSensorDetails(stoveSensorDetails))
  }

  const handleRadioChange = (event) => {
    setRadioValue(event.target.value);
  };

  return (
    <div className={classes.root}>
      <Grid container spacing={4}>
        <Grid item xs={8}>
          <div className={classes.textBox}>
            {radioValue == "°C" ? temperatureLevel[level] : wattLevel[level]}
          </div>
        </Grid>
        <Grid item xs={2}>
          <RadioGroup value={radioValue} onChange={handleRadioChange}>
            <FormControlLabel value="°C" control={<Radio />} label="°C" />
            <FormControlLabel value="W" control={<Radio />} label="W" />
          </RadioGroup>
        </Grid>
      </Grid>
      <div className={classes.buttonGroup}>
        <Button
          component='div'
          variant='outlined'
          onClick={() => {
            setPower(power => {
              if (!power) {
                setLevel(7)
                setMode("Hot Pot")
              }
              dispatchStoveDetailsChangePower()
              return !power
            })
          }}
        >
          {power ? "OFF" : "ON"}
        </Button>
        <Button
          component='div'
          variant='outlined'
          onClick={() => {
            if (!power || mode == "Warm") return
            if (level > 1) {
              setLevel(level => {
                dispatchStoveDetailsChangeLevel(-1)
                return level - 1
              })
            }
          }}
        >
          -
        </Button>
        <Button
          component='div'
          variant='outlined'
          onClick={() => {
            if (!power || mode == "Warm") return
            if (level < 7) {
              setLevel(level => {
                dispatchStoveDetailsChangeLevel(1)
                return level + 1
              })
            }
          }}
        >
          +
        </Button>
      </div>
    </div>
  )
}
