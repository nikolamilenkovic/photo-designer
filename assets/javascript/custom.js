var app = angular.module('PhotoDesigner', ['colorpicker.module', 'ui.bootstrap-slider']);

app.factory('unsplash', ['$http', function($http){
    return {
        fetchHashtag: function(hashtag, callback) {
            var endPoint = 'https://cors.nemanja.top/https://pablo.buffer.com/ajax/unsplash?search=' + hashtag;
            $http.get(endPoint).success(function(response){
                callback(response.photos);
            });
        }
    };
}]);

app.directive('myEnter', function () {
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
});

app.controller('PhotoEditorController', ['$scope', 'unsplash', function ($scope, unsplash) {
    var watermark = new Image();
    watermark.src = './assets/images/watermark.png';
    
    $scope.instagram = {};
    $scope.instagram.pics = [];
    $scope.instagram.query = 'sky';
    $scope.instagram.selected = -1;

    $scope.fonts = ['Arial', 'Tahoma', 'Times New Roman', 'Open Sans', 'Roboto', 'Lato'];
    $scope.fontWeights = ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

    $scope.url = '';

    $scope.settings = {
        text1: 'Uvek nosi knjigu sa sobom i više nikada ništa nećeš morati da čekaš!',
        text1Color: '#ffffff',
        text1FontSize: '40',
        text1Width: 0.9,
        text1Font: 'Roboto',
        text1FontWeight: 'normal',
        text1VerticalPosition: 0,
        
        text2: 'Nikola Milenković',
        text2Color: '#ffffff',
        text2FontSize: '30',
        text2Width: 0.9,
        text2Font: 'Roboto',
        text2FontWeight: 'normal',
        text2VerticalPosition: 100,
        
        radius: 3,
        darken: 0.5,
        width: 1080,
        height: 1080,
        watermarkShow: true,
        watermarkScale: 0.5,
        watermarkVerticalPosition: 0.96, // [0,1]
        borderShow: true,
        borderOpacity: 0.4,
        borderWidth: 25
    };

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
                
                $scope.renderBorder(context);

                if ($scope.settings.watermarkShow) {
                    $scope.renderWatermark(context);
                }
                if ($scope.settings.text1 !== '') {
                    $scope.renderText(context, $scope.settings.text1, $scope.settings.text1Color, $scope.settings.text1FontSize, $scope.settings.text1Width, $scope.settings.text1Font, $scope.settings.text1FontWeight, $scope.settings.text1VerticalPosition);
                }
                if ($scope.settings.text2 !== '') {
                    $scope.renderText(context, $scope.settings.text2, $scope.settings.text2Color, $scope.settings.text2FontSize, $scope.settings.text2Width, $scope.settings.text2Font, $scope.settings.text2FontWeight, $scope.settings.text2VerticalPosition);
                }

                document.getElementById('imageOut').src = canvas.toDataURL('image/png');
            }
        };
        imageObj.src = 'https://cors.nemanja.top/' + $scope.url; 
    };

    $scope.renderText = function(ctx, text, color, fontSize, textWidth, font, fontWeight, verticalPosition) {
        console.log(text, color, fontSize, textWidth, font, fontWeight, verticalPosition);
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
            var textWidth = ctx.measureText(lines[i]).width;
            ctx.fillStyle = color;
            ctx.fillText(lines[i], ($scope.settings.width - textWidth) / 2, top + fontSizePx * (i + 1) + verticalPosition);
        }
    };

    $scope.renderWatermark = function(ctx) {
        var w = watermark.width * $scope.settings.watermarkScale;
        var h = watermark.height * $scope.settings.watermarkScale;
        ctx.drawImage(watermark, ($scope.settings.width - w)/2, ($scope.settings.height - h) * $scope.settings.watermarkVerticalPosition, w, h);
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

    $scope.renderBorder = function (ctx) {
        ctx.strokeStyle = 'rgba(0, 0, 0, ' + $scope.settings.borderOpacity + ')';
        var bw = $scope.settings.borderWidth;
        ctx.lineWidth = bw;
        ctx.strokeRect(bw/2, bw/2, $scope.settings.width - bw, $scope.settings.height - bw);
    };

    $scope.instagram.isSelected = function(id){
        return $scope.instagram.selected == id;
    };

    $scope.instagram.search();
}]);

