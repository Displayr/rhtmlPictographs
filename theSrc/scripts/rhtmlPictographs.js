/* global HTMLWidgets */
import 'idempotent-babel-polyfill'
import widgetFactory from './rhtmlPictographs.factory'

HTMLWidgets.widget({
  name: 'rhtmlPictographs',
  type: 'output',
  factory: widgetFactory
})
