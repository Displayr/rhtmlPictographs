
import $ from 'jquery';
import _ from 'lodash';
import d3 from 'd3';

class RhtmlSvgWidget {
  static initClass() {
    this.widgetIndex = -1;
  }

  constructor(el, width, height) {
    this.rootElement = _.has(el, 'length') ? el[0] : el;
    this.initialWidth = width;
    this.initialHeight = height;

    RhtmlSvgWidget.widgetIndex++;
  }

  setConfig(config) {
    this.config = config;
    if (!this.config['table-id']) { this.config['table-id'] = `rhtmlwidget-${RhtmlSvgWidget.widgetIndex}`; }
    return this._processConfig();
  }

  draw() {
    this._manipulateRootElementSize();
    this._addRootSvgToRootElement();
    return this._redraw();
  }

  /* eslint-disable no-unused-vars */
  resize(width, height) {
    // NB deliberately not implemented - not needed. Subclasses can re-implement
  }
  /* eslint-enable no-unused-vars */

  _processConfig() {
    throw new Error('Must override _processConfig in child class of RhtmlSvgWidget');
  }

  _redraw() {
    throw new Error('Must override _redraw in child class of RhtmlSvgWidget');
  }

  _manipulateRootElementSize() {
    // root element has width and height in a style tag. Clear that
    $(this.rootElement).attr('style', '');

    if (this.config.resizable) {
      return $(this.rootElement).width('100%').height('100%');
    }
    return $(this.rootElement).width(this.initialWidth).height(this.initialHeight);
  }

  _addRootSvgToRootElement() {
    const anonSvg = $('<svg class="rhtmlwidget-outer-svg">')
      .addClass(this.config['table-id'])
      .attr('id', this.config['table-id'])
      .attr('width', '100%')
      .attr('height', '100%');

    $(this.rootElement).append(anonSvg);

    this.outerSvg = d3.select(anonSvg[0]);

    // NB JQuery insists on lowercasing attributes, so we must use JS directly
    // when setting viewBox and preserveAspectRatio ?!
    document.getElementsByClassName(`${this.config['table-id']} rhtmlwidget-outer-svg`)[0]
      .setAttribute('viewBox', `0 0 ${this.initialWidth} ${this.initialHeight}`);
    if (this.config.preserveAspectRatio != null) {
      document.getElementsByClassName(`${this.config['table-id']} rhtmlwidget-outer-svg`)[0]
        .setAttribute('preserveAspectRatio', this.config.preserveAspectRatio);
    }

    return null;
  }
}
RhtmlSvgWidget.initClass();

if (typeof (module) !== 'undefined') {
  module.exports = RhtmlSvgWidget;
}
