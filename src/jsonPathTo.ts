// Used from https://github.com/nidu/vscode-copy-json-path

enum ColType {
  Object, // eslint-disable-line @typescript-eslint/naming-convention
  Array, // eslint-disable-line @typescript-eslint/naming-convention
}

interface Frame {
  colType: ColType;
  index?: number;
  key?: string;
}

export function jsonPathTo(text: string, offset: number, separatorType: string, arraySeparator: string) {
  let pos = 0;
  let stack: Frame[] = [];
  let isInKey = false;

  while (pos < offset) {
    const startPos = pos;
    switch (text[pos]) {
      case '"':
        const { text: s, pos: newPos } = readString(text, pos);
        if (stack.length) {
          const frame = stack[stack.length - 1];
          if (frame.colType === ColType.Object && isInKey) {
            frame.key = s;
            isInKey = false;
          }
        }
        pos = newPos;
        break;
      case "{":
        stack.push({ colType: ColType.Object });
        isInKey = true;
        break;
      case "[":
        stack.push({ colType: ColType.Array, index: 0 });
        break;
      case "]":
        stack.pop();
        break;
      case "}":
        stack.pop();
        break;
      case ",":
        if (stack.length) {
          const frame = stack[stack.length - 1];
          if (frame) {
            if (frame.colType === ColType.Object) {
              isInKey = true;
            } else if (frame.index !== undefined) {
              frame.index++;
            }
          }
        }
        break;
    }
    if (pos === startPos) {
      pos++;
    }
  }

  if (separatorType === "dots") {
    return pathToStringDot(stack, arraySeparator);
  } else if (separatorType === "indexes") {
    return pathToStringIndexes(stack);
  } else {
    return "";
  }
}

function pathToStringDot(path: Frame[], arraySeparator: string): string {
  let s = "";
  for (const frame of path) {
    if (frame.colType === ColType.Object) {
      if (frame.key) {
        if (!frame.key.match(/^[a-zA-Z$#@&%~\-_][a-zA-Z\d$#@&%~\-_]*$/)) {
          s += `["${frame.key}"]`;
        } else {
          if (s.length) {
            s += ".";
          }
          s += frame.key;
        }
      }
    } else {
      if(arraySeparator === "dots"){
        s += `.${frame.index}`
      }
      else 
      {
        s += `[${frame.index}]`;
      }
    }
  }
  return s;
}

function pathToStringIndexes(path: Frame[]): string {
  let s = "";
  for (const frame of path) {
    if (frame.colType === ColType.Object) {
      if (frame.key) {
        if (!frame.key.match(/^[a-zA-Z$#@&%~\-_][a-zA-Z\d$#@&%~\-_]*$/)) {
          s += `["${frame.key}"]`;
        } else {
          s += '["' + frame.key + '"]';
        }
      }
    } else {
      s += `[${frame.index}]`;
    }
  }
  return s;
}

function readString(text: string, pos: number): { text: string; pos: number } {
  let i = findEndQuote(text, pos + 1);
  var textPos = {
    text: text.substring(pos + 1, i),
    pos: i + 1,
  };

  return textPos;
}

// Find the next end quote
function findEndQuote(text: string, i: number) {
  while (i < text.length) {
    // Handle backtracking to find if this quote is escaped
    if (text[i] === "\\") {
      i += 2;
    }

    if (text[i] === '"') {
      break;
    }
    i++;
  }

  return i;
}
