import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import vg from 'vega'
import { debounce } from 'lodash'
import * as StatsActions from '../../actions/stats'

class Histogram extends Component {
  state = {
    vis: null
  }

  componentDidMount() {
    const { data } = this.props
    const spec = this._spec()

    vg.parse.spec(spec, chart => {
      const vis = chart({
        el: this.refs.chartContainer,
        renderer: 'svg'
      })

      vis.onSignal('brush_start', debounce(::this.setTimeFilter, 10))
      vis.onSignal('brush_end', debounce(::this.setTimeFilter, 200))

      vis.data('activity').insert([]) // actual data comes later ^^
      vis.update()
      this.setState({ vis })
    })
  }

  setTimeFilter(signal, time) {
    if (signal === 'brush_start') {
      this.setState({
        startTime: time
      })
    } else {
      if (this.state.startTime - time === 0) {
      // startTime === endTime -> reset time filter
        this.props.actions.setTimeFilter(null)
      } else {
        this.props.actions.setTimeFilter([
          Math.min(this.state.startTime, time)/1000,
          Math.max(this.state.startTime, time)/1000
        ])
      }
    }
  }


  componentDidUpdate() {
    const { vis } = this.state
    const { data } = this.props

    if (vis) {
      // update data in case it changed
      let bins = {}
      data.forEach(feature => {
        let day = new Date(feature.properties._timestamp*1000)
        day.setMilliseconds(0)
        day.setSeconds(0)
        day.setMinutes(0)
        day.setHours(0)
        day = +day
        if (!bins[day]) bins[day] = 0
        bins[day]++
      })
      bins = Object.keys(bins).map(day => ({
        day: +day,
        count_day: bins[day]
      }))

      vis.data('activity').remove(() => true).insert(bins)

      vis.update()
    }
  }

  render() {
    return (
      <div ref='chartContainer' />
    )
  }


  _spec() {
    const chartWidth = 1000
    return {
      "width": chartWidth,
      "height": 100,
      "padding": {"top": 10, "left": 40, "bottom": 30, "right": 50},

      "signals": [
        {"name": "w", "init": chartWidth},
        {
          "name": "brush_start",
          "init": {},
          "streams": [{
            "type": "mousedown",
            "expr": "iscale('x', clamp(eventX(), 0, w))"
          }]
        },
        {
          "name": "brush_end",
          "init": {},
          "streams": [{
            "type": "mousedown, [mousedown, window:mouseup] > window:mousemove",
            "expr": "iscale('x', clamp(eventX(), 0, w))"
          }]
        }
      ],

      "data": [
        {
          "name": "activity",
          "format": {"type": "json", "parse": {"day": "date"}}
        },
      ],
      "scales": [
        {
          "name": "x",
          "type": "time",
          "range": "width",
          "domain": [
            +(new Date("2004-08-09")),
            +(new Date())
          ]
        },
        {
          "name": "y",
          "type": "linear",
          "range": "height",
          "domain": {"data": "activity", "field": "count_day"},
          "nice": true
        }
      ],
      "axes": [
        {"type": "x", "scale": "x"},
      ],
      "marks": [
        {
          "type": "rect",
          "properties": {
            "enter": {
              "fill": {"value": "green"},
              "fillOpacity": {"value": 0.7}
            },
            "update": {
              "x": {"scale": "x", "signal": "brush_start"},
              "x2": {"scale": "x", "signal": "brush_end"},
              "y": {"scale": "y", "value": ""},
              "y2": {"scale": "y", "value": 9990}
            }
          }
        },
        {
          "type": "rect",
          "from": {"data": "activity"},
          "properties": {
            "enter": {
              "x": {"scale": "x", "field": "day"},
              "width": {"value": 2},
              "y": {"scale": "y", "field": "count_day"},
              "y2": {"scale": "y", "value": 0}
            },
            "update": {
              "fill": [
                { "test": "brush_start==brush_end || inrange(datum.day, brush_start, brush_end)",
                  "value": "red"
                },
                {"value": "steelblue"}
              ]
            }
          }
        }
      ]
    }
  }
}


function mapStateToProps(state) {
  return {
    // todo: handle filters & overlays via state.map.*
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(StatsActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Histogram)