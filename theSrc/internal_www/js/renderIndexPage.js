import _ from 'lodash';
import $ from 'jquery';

$(document).ready(function () {
  $.ajax('/content/contentManifest.json').done((contents) => {
    _(contents).forIn((contentLinks, contentType) => {
      _(contentLinks).each((contentLink) => {
        const listItem = $('<li>');
        const link = $('<a>')
          .attr('href', contentLink)
          .html(_.last(contentLink.split('/')));

        $(`ul.${contentType}`).append(listItem.append(link));
      });
    });
  });
});
