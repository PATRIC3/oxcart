
//   (\/\*([\d\t\n\s\d\w;"=,'_\}{/.<>()-]|:)+\*\/)


            function getStructs(data) {
                var data = data.replace(/(\r\n|\n|\r)/g,'');

                var start = data.indexOf('{')+1

                var structs = [];
                while (true) {
                    var pos = getStructPos(data, '{', '}', start);

                    if (!pos)
                        break

                    structs.push( data.slice(pos[0], pos[1]) );
                    start = pos[1]; // set start to end

                }
                console.log('structs', structs)
                return structs;
            }

            function getStructPos(data, char1, char2, start) {
                var i = start;

                var skip = false,
                    foundStart = false,
                    foundEnd = false;

                while (true) {
                    i++;
                    if (i > data.lastIndexOf(char2)-2 )
                        return;

                    var c = data[i];

                    // if end of comment, stop skipping
                    if (skip && c == '*' && data[i+1] == '/') {
                        skip = false;
                        continue;
                    }

                    if (skip) continue

                    /* if comment, find end of comment */
                    if (c == '/' && data[i+1] == '*') {
                        skip = true;
                        continue
                    }


                    if (!foundStart && c == char1) {
                        var startPos = i;
                        foundStart = true
                        continue
                    }

                    if (foundStart && !foundEnd && c == char2) {
                        var endPos = i;
                        foundEnd = true;
                    }

                    if (foundStart && foundEnd)
                        break;
                }

                return [startPos, endPos+2];
            }