
import d3 from 'd3';
import _ from 'lodash';

// I am a singleton, all my methods and variables are static
// NB @TODO if we have two active Pictographs at same time this becomes an issue

class ColorFactory {
  static initClass() {
    this.palettes = {};
    this.aliases = {};

    // http://bl.ocks.org/aaizemberg/78bd3dade9593896a59d
    const googleColors = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395', '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300', '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac'];
    this.processNewConfig({
      palettes: {
        displayr: ['#5b9bd5', '#ed7d31', '#a5a5a5', '#1ec000', '#4472c4', '#70ad47', '#255e91', '#9e480e', '#636363', '#997300', '#264478', '#43682b', '#000000', '#ff2323'],
        google10: googleColors.slice(0, 10),
        google20: googleColors.slice(0, 20),
        d310: _.range(0, 10).map(d3.scale.category10()),
        d320: _.range(0, 20).map(d3.scale.category20()),
        d320b: _.range(0, 20).map(d3.scale.category20b()),
        d320c: _.range(0, 20).map(d3.scale.category20c()),
      },
    });
  }

  static processNewConfig(config) {
    if (config.palettes) {
      _.forEach(config.palettes, (newPaletteColors, newPaletteName) => {
        if (_.has(this.palettes, newPaletteName)) {
          throw new Error(`cannot define ${newPaletteName} palette twice`);
        }

        if (_.has(this.aliases, newPaletteName)) {
          throw new Error(`cannot define ${newPaletteName} palette, an alias with same name already exists`);
        }

        this.palettes[newPaletteName] = {
          colors: newPaletteColors,
          index: 0,
        };
      });
    }

    if (config.aliases) {
      _.forEach(config.aliases, (aliasColor, aliasName) => {
        if (_.has(this.palettes, aliasName)) {
          throw new Error(`cannot define ${aliasName} alias, a palette with same name already exists`);
        }

        if (_.has(this.aliases, aliasName)) {
          throw new Error(`cannot define ${aliasName} alias twice`);
        }

        this.aliases[aliasName] = aliasColor;
      });
    }
  }

  static getColor(color) {
    if (_.has(this.palettes, color)) {
      return this.getColorFromPalette(color);
    }

    if (_.has(this.aliases, color)) {
      return this.aliases[color];
    }

    return color;
  }

  static getColorFromPalette(paletteName) {
    if (!_.has(this.palettes, paletteName)) {
      throw new Error(`palette '${paletteName}' does not exist`);
    }

    const palette = this.palettes[paletteName];

    const currentIndex = palette.index;
    palette.index = (palette.index += 1) % palette.colors.length;

    return palette.colors[currentIndex];
  }
}
ColorFactory.initClass();

module.exports = ColorFactory;
