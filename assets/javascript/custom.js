angular.module('PhotoDesigner', ['colorpicker.module', 'ui.bootstrap-slider', 'LocalStorageModule']).config(['localStorageServiceProvider', 
    function (localStorageServiceProvider) {
        localStorageServiceProvider.setPrefix('PhotoDesigner');
    }
]).factory('unsplash', ['$http', function($http) {
    return {
        fetchHashtag: function(hashtag, callback) {
            var endPoint = 'https://cors.nemanja.top/https://pablo.buffer.com/ajax/unsplash?search=' + hashtag;
            $http.get(endPoint).success(function(response) {
                callback(response.photos);
            });
        }
    };
}]).directive('myEnter', function () { 
    return function (scope, element, attrs) {
        element.bind('keydown keypress', function (event) {
            if(event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.myEnter);
                });
                event.preventDefault();
            }
        });
    };
}).controller('PhotoEditorController', ['$scope', '$window', 'unsplash', 'localStorageService', function ($scope, $window, unsplash, localStorageService) {
    var deCorsUrl = 'https://cors.nemanja.top/';
    $scope.watermark = new Image();
    $scope.instagram = {};
    $scope.instagram.pics = [];
    $scope.instagram.query = 'sky';
    $scope.instagram.selected = -1;

    $scope.fonts = ['Arial', 'Tahoma', 'Times New Roman', 'Open Sans', 'Roboto', 'Lato', 'Courgette', 'Kollektif', 'League Spartan', 'Montserrat', 'Selima'];
    $scope.fontWeights = ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

    $scope.url = '';

    $scope.defaultSettings = {
        text1Show: true,
        text1: 'Uvek nosi knjigu sa sobom i više nikada ništa nećeš morati da čekaš!',
        text1Color: '#ffffff',
        text1FontSize: '40',
        text1Width: 0.9,
        text1Font: 'Roboto',
        text1FontWeight: 'normal',
        text1VerticalPosition: 0,
        text1Align: 'center',
        
        text2Show: true,
        text2: 'Nikola Milenković',
        text2Color: '#ffffff',
        text2FontSize: '30',
        text2Width: 0.9,
        text2Font: 'Roboto',
        text2FontWeight: 'normal',
        text2VerticalPosition: 100,
        text2Align: 'center',

        radius: 0,
        darken: 0.5,
        width: 1080,
        height: 1080,
        watermarkShow: true,
        watermarkScale: 0.5,
        watermarkVerticalPosition: 0.96, // [0,1]
        watermarkOpacity: 1.0,
        watermarkURL: $window.location.protocol + '//' + $window.location.host + '/assets/images/watermark-url.png',
        borderShow: true,
        borderColor: '#ffffff',
        borderOpacity: 0.4,
        borderWidth: 25
    };

    var savedSettings = localStorageService.get('settings');

    $scope.settings = !savedSettings ? $scope.defaultSettings : JSON.parse(savedSettings);

    $scope.watermark.src = $scope.settings.watermarkURL;
    $scope.output = {};
    $scope.output.image = '';

    $scope.instagram.search = function() {
        unsplash.fetchHashtag($scope.instagram.query, function(data) {
            $scope.instagram.selected = -1;
            $scope.instagram.pics = data;
        });
    };

    $scope.instagram.select = function(id) {
        $scope.instagram.selected = id;
        $scope.url = $scope.instagram.pics[$scope.instagram.selected][1];
        $scope.rerender();
    };

    $scope.rerender = function() {
        if ($scope.url === '') {
            return false;
        }

        localStorageService.set('settings', JSON.stringify($scope.settings));

        var canvas = document.getElementById('image');
        
        var imageObj = new Image();
        imageObj.crossOrigin = 'Anonymous';
        imageObj.onload = function() {
            StackBlur.image(imageObj, canvas, $scope.settings.radius, true);
            var src = canvas.toDataURL('image/png');
            var img = document.createElement('img');
            img.src = src;
            img.onload = function() {
                canvas.width = $scope.settings.width;
                canvas.height = $scope.settings.height;

                if (imageObj.width > imageObj.height) {
                    var scale = $scope.settings.height / imageObj.height;
                    imageObj.width = imageObj.width * scale;;
                    imageObj.height = $scope.settings.height;
                } else {
                    var scale = $scope.settings.width / imageObj.width;
                    imageObj.width = $scope.settings.width;
                    imageObj.height = imageObj.height * scale;
                }

                var context = canvas.getContext('2d');
                context.drawImage(img, (-1*(imageObj.width - $scope.settings.width))/2, (-1*(imageObj.height - $scope.settings.height))/2, imageObj.width, imageObj.height);
                context.fillStyle = 'rgba(0, 0, 0, ' + $scope.settings.darken + ')';
                context.fillRect(0, 0, $scope.settings.width, $scope.settings.height);
                
                if ($scope.settings.borderShow) {
                    $scope.renderBorder(context);
                }

                if ($scope.settings.watermarkShow) {
                    $scope.renderWatermark(context);
                }
                if ($scope.settings.text1Show && $scope.settings.text1 !== '') {
                    $scope.renderText(context,
                                      $scope.settings.text1,
                                      $scope.settings.text1Color,
                                      $scope.settings.text1FontSize,
                                      $scope.settings.text1Width,
                                      $scope.settings.text1Font,
                                      $scope.settings.text1FontWeight,
                                      $scope.settings.text1VerticalPosition,
                                      $scope.settings.text1Align);
                }
                if ($scope.settings.text2Show && $scope.settings.text2 !== '') {
                    $scope.renderText(context,
                                      $scope.settings.text2,
                                      $scope.settings.text2Color,
                                      $scope.settings.text2FontSize,
                                      $scope.settings.text2Width,
                                      $scope.settings.text2Font,
                                      $scope.settings.text2FontWeight,
                                      $scope.settings.text2VerticalPosition,
                                      $scope.settings.text2Align);
                }

                document.getElementById('imageOut').src = canvas.toDataURL('image/jpeg'); 
            }
        };
        imageObj.src = deCorsUrl + $scope.url; 
    };

    $scope.renderText = function(ctx, text, color, fontSize, textWidth, font, fontWeight, verticalPosition, align) {
        var fontSizePx = 4 / 3 * fontSize;
        ctx.font = fontWeight + ' ' + fontSize + 'pt "' + font + '"';
        var lines = text.split('\n');
        lines = lines.map(function(line) {
            return $scope.getLines(ctx, line, $scope.settings.width * textWidth);
        });

        var newLines = [];
        lines.forEach(function(line) {
            newLines = newLines.concat(line);
        });

        lines = newLines;

        var top = ($scope.settings.height - lines.length * fontSizePx) / 2;
        for (i = 0; i < lines.length; i++) {
            var lineWidth = ctx.measureText(lines[i]).width;
            ctx.fillStyle = color;
            var left = ($scope.settings.width - lineWidth) / 2; // center
            if (align === 'left') {
                left = ($scope.settings.width - $scope.settings.width * textWidth) / 2;
            } else if (align === 'right') {
                left = $scope.settings.width - (($scope.settings.width - $scope.settings.width * textWidth)/2) - lineWidth;
            }
            ctx.fillText(lines[i], left, top + fontSizePx * (i + 1) + verticalPosition);
        }
    };

    $scope.renderWatermark = function(ctx) {
        var w = $scope.watermark.width * $scope.settings.watermarkScale;
        var h = $scope.watermark.height * $scope.settings.watermarkScale;
        var previousAlpha = ctx.globalAlpha;

        ctx.globalAlpha = $scope.settings.watermarkOpacity;
        ctx.drawImage($scope.watermark, ($scope.settings.width - w)/2, ($scope.settings.height - h) * $scope.settings.watermarkVerticalPosition, w, h);
        ctx.globalAlpha = previousAlpha;
    };

    $scope.getLines = function(ctx, text, maxWidth) {
        var words = text.split(' ');
        var lines = [];

        var currentLine = words[0];

        for (var i = 1; i < words.length; i++) {
            var word = words[i];
            var width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }

        if (currentLine !== ''){
            lines.push(currentLine);
        }

        return lines;
    };

    $scope.renderBorder = function(ctx) {
        var rgb = $scope.hex2Rgb($scope.settings.borderColor);
        ctx.strokeStyle = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + $scope.settings.borderOpacity + ')';
        var bw = $scope.settings.borderWidth;
        ctx.lineWidth = bw;
        ctx.strokeRect(bw/2, bw/2, $scope.settings.width - bw, $scope.settings.height - bw);
    };

    $scope.instagram.isSelected = function(id){
        return $scope.instagram.selected == id;
    };

    $scope.hex2Rgb = function(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    $scope.resetSettingsToDefault = function() {
        $scope.settings = $scope.defaultSettings;
        $scope.rerender();
    };

    $scope.save = function() {
        var link = document.getElementById('downloadLink');
        var image = document.getElementById('image')
                            .toDataURL('image/jpeg')
                            .replace('image/jpeg', 'image/octet-stream');
        link.setAttribute('download', $scope.stripSpecialCharactersFromFileName($scope.settings.text1) + '.jpg');
        link.setAttribute('href', image);
        link.click();
    };

    $scope.stripSpecialCharactersFromFileName = function(fileName) {
        var stripped = fileName.replace('\\', '')
                               .replace('\n', '')
                               .replace('\t', '')
                               .replace('_', '')
                               .replace('-', '')
                               .replace('/', '')
                               .replace('|', '')
                               .replace('*', '')
                               .replace('.', '')
                               .replace(',', '')
                               .replace('#', '')
                               .replace('?', '')
                               .replace('"', '')
                               .replace('<', '')
                               .replace('>', '')
                               .replace(':', '')
                               .replace('!', '')
                               .toLowerCase();
        return stripped;
    };

    $scope.$watch('settings.watermarkURL', function(newURL, oldURL) {
        if (oldURL && newURL !== oldURL) {
            $scope.watermark = new Image();
            $scope.watermark.crossOrigin = 'Anonymous';
            $scope.watermark.src = deCorsUrl + newURL;
            $scope.watermark.onload = function() {
                $scope.watermark.onload = null;
                $scope.rerender();
            }
        }
    });

    $scope.instagram.search();
}]);

