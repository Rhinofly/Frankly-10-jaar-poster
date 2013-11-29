/**
 * Converts a Illustrator Path export to canvas blah
 * borrowed from: webdev.stephband.info/canvas/convert.html
 */


function convertPath(file){
  // Converts AI coordinates into Canvas code.
    
    var regexBegin    = /.*?\*u/;
    var regexNewPath  = /^n$/;                                                                     
        // Matches everything up to the first "*u"
    var regexCoord    = /((\b|[+-])[0-9]+(\.[0-9]+)?\b)\s*[\,\s]\s*((\b|[+-])[0-9]+(\.[0-9]+)?\b)/;   
        // Matches "6.0, 89" or "0 34" or "1.000  , 56.2". The numbers themselves are encapsulated at array position [1] and [4]
    var regexCoords   = /((?:\b|[+-])[0-9]+(?:\.[0-9]+)?\b)\s*[\,\s]\s*((?:\b|[+-])[0-9]+(?:\.[0-9]+)?\b)(?:\s*[\,\s]\s*((?:\b|[+-])[0-9]+(?:\.[0-9]+)?\b)\s*[\,\s]\s*((?:\b|[+-])[0-9]+(?:\.[0-9]+)?\b))?(?:\s*[\,\s]\s*((?:\b|[+-])[0-9]+(?:\.[0-9]+)?\b)\s*[\,\s]\s*((?:\b|[+-])[0-9]+(?:\.[0-9]+)?\b))?.*?/;
        // Matches up to six space or comma delineated floating point numbers. The numbers are encapsulated at array positions [1-6]
    var regexUnion    = /\/operation\s\/union|\/operation\s\/subtract/;                   
        // Matches any complete line containing "/operation /union" or "/operation /subtract" - must switch multiline on!
    var i = 0, j = 0, k = 0, l = 0;
   // var ctx  = canvas.elements["background"].ctx;
    var line = "";
    var data = [];
    var flagtest;
    var flag = [];
    var code = "";
    var dec  = 100;    // Sets number of decimal places (10 is 1, 100 is 2, etc.)
    
    // Make file into an array
    file = (typeof(file) == 'string') ? file.split(/\n/) : file;

    while (file.length) {
      // Remove first line of file and test it for coordinates
      line = file.shift();
      data[i] = regexCoords.exec(line);
      
      if (data[i]) {
        // Remove full match in cell [0]
        data[i].shift();
        // Remove undefined cells at end of array
        for (j=0; j < data[i].length; j++) {
          if (!data[i][j]) {
            data[i] = data[i].slice(0,j);
            break;
          }
        }
        i++;
      }
      // Otherwise test it for new path 
      else {
        flagtest = regexNewPath.exec(line);
        if (flagtest) {
          flag[i] = "move";
          //console.log(""+flag);
        }
        // Remove the row from data, since it's null anyway
        data.pop();
      }
    }
    
    if (!flag[0]) flag[0]="move";
    
    // Convert strings to floats
    for (j=1; j<data.length; j++) {
      for (k=0; k < data[j].length; k++) {
        data[j][k] = parseFloat(data[j][k]);
      }
    }
    
    // Put first coords into max and min
    var min = [data[0][0], data[0][1]];
    var max = [data[0][0], data[0][1]];
    var mag;
    
    // Go back over the data and find max and min
    for (j=1; j<data.length; j++) {
      l=data[j].length;
      min[0] = (data[j][l-2] < min[0]) ? data[j][l-2] : min[0];
      min[1] = (data[j][l-1] < min[1]) ? data[j][l-1] : min[1];
      max[0] = (data[j][l-2] > max[0]) ? data[j][l-2] : max[0];        
      max[1] = (data[j][l-1] > max[1]) ? data[j][l-1] : max[1];
    }
    mag = [max[0]-min[0], max[1]-min[1]];
    //console.log(min+" "+max+" "+mag);
    
    // Subtract min (normalise to 0,0) and invert y axis
    for (j=0; j<data.length; j++) {
      for (k=0; k < data[j].length; k=k+2) {
        data[j][k]   = data[j][k]   - min[0];
        data[j][k+1] = data[j][k+1] - min[1];
        // Invert y axis
        data[j][k+1] = mag[1] - data[j][k+1];
        // Truncate decimals
        data[j][k]   = (parseInt(data[j][k]  *dec))/(dec);
        data[j][k+1] = (parseInt(data[j][k+1]*dec))/(dec);
      }
    }
    
    // Go back over the data and make 4 entry arrays into 6 entry arrays
    for (j=0; j<data.length; j++) {
      // point node to a bezier node
      if (data[j].length==4 && data[j-1].length==2) {
        data[j] = [data[j-1][0], data[j-1][1]].concat(data[j]);
      }
      // bezier node to a point node
      else if (data[j].length==4 && (data[j-1].length==6 || data[j-1].length==4)) {
        data[j] = data[j].slice(0,2).concat(data[j].slice(2,4), data[j].slice(2,4));
      }
    }    
        
    // Assemble the result
    var command;
    var return_arr = [];
    code = code+"ctx.beginPath();\n";
    for (j=0; j<data.length; j++) {
      if (data[j].length==2) {
        if      (flag[j]=="move") {command = "moveTo";}
        else                      {command = "lineTo";}
      }
      else {
        command="bezierCurveTo";
      }
      code = code+"ctx."+command+"("+data[j]+");\n";
      return_arr.push({command:command, pathData: data[j]});
    }

    // Display
    return return_arr;
  }
