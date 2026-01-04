var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/source-map-js/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/source-map-js/lib/base64.js"(exports) {
    var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    exports.encode = function(number) {
      if (0 <= number && number < intToCharMap.length) {
        return intToCharMap[number];
      }
      throw new TypeError("Must be between 0 and 63: " + number);
    };
    exports.decode = function(charCode) {
      var bigA = 65;
      var bigZ = 90;
      var littleA = 97;
      var littleZ = 122;
      var zero = 48;
      var nine = 57;
      var plus = 43;
      var slash = 47;
      var littleOffset = 26;
      var numberOffset = 52;
      if (bigA <= charCode && charCode <= bigZ) {
        return charCode - bigA;
      }
      if (littleA <= charCode && charCode <= littleZ) {
        return charCode - littleA + littleOffset;
      }
      if (zero <= charCode && charCode <= nine) {
        return charCode - zero + numberOffset;
      }
      if (charCode == plus) {
        return 62;
      }
      if (charCode == slash) {
        return 63;
      }
      return -1;
    };
  }
});

// node_modules/source-map-js/lib/base64-vlq.js
var require_base64_vlq = __commonJS({
  "node_modules/source-map-js/lib/base64-vlq.js"(exports) {
    var base64 = require_base64();
    var VLQ_BASE_SHIFT = 5;
    var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
    var VLQ_BASE_MASK = VLQ_BASE - 1;
    var VLQ_CONTINUATION_BIT = VLQ_BASE;
    function toVLQSigned(aValue) {
      return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
    }
    function fromVLQSigned(aValue) {
      var isNegative = (aValue & 1) === 1;
      var shifted = aValue >> 1;
      return isNegative ? -shifted : shifted;
    }
    exports.encode = function base64VLQ_encode(aValue) {
      var encoded = "";
      var digit;
      var vlq = toVLQSigned(aValue);
      do {
        digit = vlq & VLQ_BASE_MASK;
        vlq >>>= VLQ_BASE_SHIFT;
        if (vlq > 0) {
          digit |= VLQ_CONTINUATION_BIT;
        }
        encoded += base64.encode(digit);
      } while (vlq > 0);
      return encoded;
    };
    exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
      var strLen = aStr.length;
      var result = 0;
      var shift = 0;
      var continuation, digit;
      do {
        if (aIndex >= strLen) {
          throw new Error("Expected more digits in base 64 VLQ value.");
        }
        digit = base64.decode(aStr.charCodeAt(aIndex++));
        if (digit === -1) {
          throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
        }
        continuation = !!(digit & VLQ_CONTINUATION_BIT);
        digit &= VLQ_BASE_MASK;
        result = result + (digit << shift);
        shift += VLQ_BASE_SHIFT;
      } while (continuation);
      aOutParam.value = fromVLQSigned(result);
      aOutParam.rest = aIndex;
    };
  }
});

// node_modules/source-map-js/lib/util.js
var require_util = __commonJS({
  "node_modules/source-map-js/lib/util.js"(exports) {
    function getArg(aArgs, aName, aDefaultValue) {
      if (aName in aArgs) {
        return aArgs[aName];
      } else if (arguments.length === 3) {
        return aDefaultValue;
      } else {
        throw new Error('"' + aName + '" is a required argument.');
      }
    }
    exports.getArg = getArg;
    var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
    var dataUrlRegexp = /^data:.+\,.+$/;
    function urlParse(aUrl) {
      var match = aUrl.match(urlRegexp);
      if (!match) {
        return null;
      }
      return {
        scheme: match[1],
        auth: match[2],
        host: match[3],
        port: match[4],
        path: match[5]
      };
    }
    exports.urlParse = urlParse;
    function urlGenerate(aParsedUrl) {
      var url = "";
      if (aParsedUrl.scheme) {
        url += aParsedUrl.scheme + ":";
      }
      url += "//";
      if (aParsedUrl.auth) {
        url += aParsedUrl.auth + "@";
      }
      if (aParsedUrl.host) {
        url += aParsedUrl.host;
      }
      if (aParsedUrl.port) {
        url += ":" + aParsedUrl.port;
      }
      if (aParsedUrl.path) {
        url += aParsedUrl.path;
      }
      return url;
    }
    exports.urlGenerate = urlGenerate;
    var MAX_CACHED_INPUTS = 32;
    function lruMemoize(f) {
      var cache = [];
      return function(input) {
        for (var i = 0; i < cache.length; i++) {
          if (cache[i].input === input) {
            var temp = cache[0];
            cache[0] = cache[i];
            cache[i] = temp;
            return cache[0].result;
          }
        }
        var result = f(input);
        cache.unshift({
          input,
          result
        });
        if (cache.length > MAX_CACHED_INPUTS) {
          cache.pop();
        }
        return result;
      };
    }
    var normalize = lruMemoize(function normalize2(aPath) {
      var path = aPath;
      var url = urlParse(aPath);
      if (url) {
        if (!url.path) {
          return aPath;
        }
        path = url.path;
      }
      var isAbsolute = exports.isAbsolute(path);
      var parts = [];
      var start = 0;
      var i = 0;
      while (true) {
        start = i;
        i = path.indexOf("/", start);
        if (i === -1) {
          parts.push(path.slice(start));
          break;
        } else {
          parts.push(path.slice(start, i));
          while (i < path.length && path[i] === "/") {
            i++;
          }
        }
      }
      for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
        part = parts[i];
        if (part === ".") {
          parts.splice(i, 1);
        } else if (part === "..") {
          up++;
        } else if (up > 0) {
          if (part === "") {
            parts.splice(i + 1, up);
            up = 0;
          } else {
            parts.splice(i, 2);
            up--;
          }
        }
      }
      path = parts.join("/");
      if (path === "") {
        path = isAbsolute ? "/" : ".";
      }
      if (url) {
        url.path = path;
        return urlGenerate(url);
      }
      return path;
    });
    exports.normalize = normalize;
    function join(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      if (aPath === "") {
        aPath = ".";
      }
      var aPathUrl = urlParse(aPath);
      var aRootUrl = urlParse(aRoot);
      if (aRootUrl) {
        aRoot = aRootUrl.path || "/";
      }
      if (aPathUrl && !aPathUrl.scheme) {
        if (aRootUrl) {
          aPathUrl.scheme = aRootUrl.scheme;
        }
        return urlGenerate(aPathUrl);
      }
      if (aPathUrl || aPath.match(dataUrlRegexp)) {
        return aPath;
      }
      if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
        aRootUrl.host = aPath;
        return urlGenerate(aRootUrl);
      }
      var joined = aPath.charAt(0) === "/" ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
      if (aRootUrl) {
        aRootUrl.path = joined;
        return urlGenerate(aRootUrl);
      }
      return joined;
    }
    exports.join = join;
    exports.isAbsolute = function(aPath) {
      return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
    };
    function relative(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      aRoot = aRoot.replace(/\/$/, "");
      var level = 0;
      while (aPath.indexOf(aRoot + "/") !== 0) {
        var index = aRoot.lastIndexOf("/");
        if (index < 0) {
          return aPath;
        }
        aRoot = aRoot.slice(0, index);
        if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
          return aPath;
        }
        ++level;
      }
      return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
    }
    exports.relative = relative;
    var supportsNullProto = (function() {
      var obj = /* @__PURE__ */ Object.create(null);
      return !("__proto__" in obj);
    })();
    function identity(s) {
      return s;
    }
    function toSetString(aStr) {
      if (isProtoString(aStr)) {
        return "$" + aStr;
      }
      return aStr;
    }
    exports.toSetString = supportsNullProto ? identity : toSetString;
    function fromSetString(aStr) {
      if (isProtoString(aStr)) {
        return aStr.slice(1);
      }
      return aStr;
    }
    exports.fromSetString = supportsNullProto ? identity : fromSetString;
    function isProtoString(s) {
      if (!s) {
        return false;
      }
      var length = s.length;
      if (length < 9) {
        return false;
      }
      if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
        return false;
      }
      for (var i = length - 10; i >= 0; i--) {
        if (s.charCodeAt(i) !== 36) {
          return false;
        }
      }
      return true;
    }
    function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
      var cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByOriginalPositions = compareByOriginalPositions;
    function compareByOriginalPositionsNoSource(mappingA, mappingB, onlyCompareOriginal) {
      var cmp;
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByOriginalPositionsNoSource = compareByOriginalPositionsNoSource;
    function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
    function compareByGeneratedPositionsDeflatedNoLine(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsDeflatedNoLine = compareByGeneratedPositionsDeflatedNoLine;
    function strcmp(aStr1, aStr2) {
      if (aStr1 === aStr2) {
        return 0;
      }
      if (aStr1 === null) {
        return 1;
      }
      if (aStr2 === null) {
        return -1;
      }
      if (aStr1 > aStr2) {
        return 1;
      }
      return -1;
    }
    function compareByGeneratedPositionsInflated(mappingA, mappingB) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
    function parseSourceMapInput(str) {
      return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
    }
    exports.parseSourceMapInput = parseSourceMapInput;
    function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
      sourceURL = sourceURL || "";
      if (sourceRoot) {
        if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
          sourceRoot += "/";
        }
        sourceURL = sourceRoot + sourceURL;
      }
      if (sourceMapURL) {
        var parsed = urlParse(sourceMapURL);
        if (!parsed) {
          throw new Error("sourceMapURL could not be parsed");
        }
        if (parsed.path) {
          var index = parsed.path.lastIndexOf("/");
          if (index >= 0) {
            parsed.path = parsed.path.substring(0, index + 1);
          }
        }
        sourceURL = join(urlGenerate(parsed), sourceURL);
      }
      return normalize(sourceURL);
    }
    exports.computeSourceURL = computeSourceURL;
  }
});

// node_modules/source-map-js/lib/array-set.js
var require_array_set = __commonJS({
  "node_modules/source-map-js/lib/array-set.js"(exports) {
    var util = require_util();
    var has = Object.prototype.hasOwnProperty;
    var hasNativeMap = typeof Map !== "undefined";
    function ArraySet() {
      this._array = [];
      this._set = hasNativeMap ? /* @__PURE__ */ new Map() : /* @__PURE__ */ Object.create(null);
    }
    ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
      var set = new ArraySet();
      for (var i = 0, len = aArray.length; i < len; i++) {
        set.add(aArray[i], aAllowDuplicates);
      }
      return set;
    };
    ArraySet.prototype.size = function ArraySet_size() {
      return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
    };
    ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
      var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
      var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
      var idx = this._array.length;
      if (!isDuplicate || aAllowDuplicates) {
        this._array.push(aStr);
      }
      if (!isDuplicate) {
        if (hasNativeMap) {
          this._set.set(aStr, idx);
        } else {
          this._set[sStr] = idx;
        }
      }
    };
    ArraySet.prototype.has = function ArraySet_has(aStr) {
      if (hasNativeMap) {
        return this._set.has(aStr);
      } else {
        var sStr = util.toSetString(aStr);
        return has.call(this._set, sStr);
      }
    };
    ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
      if (hasNativeMap) {
        var idx = this._set.get(aStr);
        if (idx >= 0) {
          return idx;
        }
      } else {
        var sStr = util.toSetString(aStr);
        if (has.call(this._set, sStr)) {
          return this._set[sStr];
        }
      }
      throw new Error('"' + aStr + '" is not in the set.');
    };
    ArraySet.prototype.at = function ArraySet_at(aIdx) {
      if (aIdx >= 0 && aIdx < this._array.length) {
        return this._array[aIdx];
      }
      throw new Error("No element indexed by " + aIdx);
    };
    ArraySet.prototype.toArray = function ArraySet_toArray() {
      return this._array.slice();
    };
    exports.ArraySet = ArraySet;
  }
});

// node_modules/source-map-js/lib/mapping-list.js
var require_mapping_list = __commonJS({
  "node_modules/source-map-js/lib/mapping-list.js"(exports) {
    var util = require_util();
    function generatedPositionAfter(mappingA, mappingB) {
      var lineA = mappingA.generatedLine;
      var lineB = mappingB.generatedLine;
      var columnA = mappingA.generatedColumn;
      var columnB = mappingB.generatedColumn;
      return lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
    }
    function MappingList() {
      this._array = [];
      this._sorted = true;
      this._last = { generatedLine: -1, generatedColumn: 0 };
    }
    MappingList.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
      this._array.forEach(aCallback, aThisArg);
    };
    MappingList.prototype.add = function MappingList_add(aMapping) {
      if (generatedPositionAfter(this._last, aMapping)) {
        this._last = aMapping;
        this._array.push(aMapping);
      } else {
        this._sorted = false;
        this._array.push(aMapping);
      }
    };
    MappingList.prototype.toArray = function MappingList_toArray() {
      if (!this._sorted) {
        this._array.sort(util.compareByGeneratedPositionsInflated);
        this._sorted = true;
      }
      return this._array;
    };
    exports.MappingList = MappingList;
  }
});

// node_modules/source-map-js/lib/source-map-generator.js
var require_source_map_generator = __commonJS({
  "node_modules/source-map-js/lib/source-map-generator.js"(exports) {
    var base64VLQ = require_base64_vlq();
    var util = require_util();
    var ArraySet = require_array_set().ArraySet;
    var MappingList = require_mapping_list().MappingList;
    function SourceMapGenerator2(aArgs) {
      if (!aArgs) {
        aArgs = {};
      }
      this._file = util.getArg(aArgs, "file", null);
      this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
      this._skipValidation = util.getArg(aArgs, "skipValidation", false);
      this._ignoreInvalidMapping = util.getArg(aArgs, "ignoreInvalidMapping", false);
      this._sources = new ArraySet();
      this._names = new ArraySet();
      this._mappings = new MappingList();
      this._sourcesContents = null;
    }
    SourceMapGenerator2.prototype._version = 3;
    SourceMapGenerator2.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer, generatorOps) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator2(Object.assign(generatorOps || {}, {
        file: aSourceMapConsumer.file,
        sourceRoot
      }));
      aSourceMapConsumer.eachMapping(function(mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };
        if (mapping.source != null) {
          newMapping.source = mapping.source;
          if (sourceRoot != null) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }
          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };
          if (mapping.name != null) {
            newMapping.name = mapping.name;
          }
        }
        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var sourceRelative = sourceFile;
        if (sourceRoot !== null) {
          sourceRelative = util.relative(sourceRoot, sourceFile);
        }
        if (!generator._sources.has(sourceRelative)) {
          generator._sources.add(sourceRelative);
        }
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };
    SourceMapGenerator2.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, "generated");
      var original = util.getArg(aArgs, "original", null);
      var source = util.getArg(aArgs, "source", null);
      var name = util.getArg(aArgs, "name", null);
      if (!this._skipValidation) {
        if (this._validateMapping(generated, original, source, name) === false) {
          return;
        }
      }
      if (source != null) {
        source = String(source);
        if (!this._sources.has(source)) {
          this._sources.add(source);
        }
      }
      if (name != null) {
        name = String(name);
        if (!this._names.has(name)) {
          this._names.add(name);
        }
      }
      this._mappings.add({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source,
        name
      });
    };
    SourceMapGenerator2.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot != null) {
        source = util.relative(this._sourceRoot, source);
      }
      if (aSourceContent != null) {
        if (!this._sourcesContents) {
          this._sourcesContents = /* @__PURE__ */ Object.create(null);
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else if (this._sourcesContents) {
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };
    SourceMapGenerator2.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      var sourceFile = aSourceFile;
      if (aSourceFile == null) {
        if (aSourceMapConsumer.file == null) {
          throw new Error(
            `SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`
          );
        }
        sourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      if (sourceRoot != null) {
        sourceFile = util.relative(sourceRoot, sourceFile);
      }
      var newSources = new ArraySet();
      var newNames = new ArraySet();
      this._mappings.unsortedForEach(function(mapping) {
        if (mapping.source === sourceFile && mapping.originalLine != null) {
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source != null) {
            mapping.source = original.source;
            if (aSourceMapPath != null) {
              mapping.source = util.join(aSourceMapPath, mapping.source);
            }
            if (sourceRoot != null) {
              mapping.source = util.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name != null) {
              mapping.name = original.name;
            }
          }
        }
        var source = mapping.source;
        if (source != null && !newSources.has(source)) {
          newSources.add(source);
        }
        var name = mapping.name;
        if (name != null && !newNames.has(name)) {
          newNames.add(name);
        }
      }, this);
      this._sources = newSources;
      this._names = newNames;
      aSourceMapConsumer.sources.forEach(function(sourceFile2) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile2);
        if (content != null) {
          if (aSourceMapPath != null) {
            sourceFile2 = util.join(aSourceMapPath, sourceFile2);
          }
          if (sourceRoot != null) {
            sourceFile2 = util.relative(sourceRoot, sourceFile2);
          }
          this.setSourceContent(sourceFile2, content);
        }
      }, this);
    };
    SourceMapGenerator2.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
      if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
        var message = "original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.";
        if (this._ignoreInvalidMapping) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn(message);
          }
          return false;
        } else {
          throw new Error(message);
        }
      }
      if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
        return;
      } else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
        return;
      } else {
        var message = "Invalid mapping: " + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        });
        if (this._ignoreInvalidMapping) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn(message);
          }
          return false;
        } else {
          throw new Error(message);
        }
      }
    };
    SourceMapGenerator2.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = "";
      var next;
      var mapping;
      var nameIdx;
      var sourceIdx;
      var mappings = this._mappings.toArray();
      for (var i = 0, len = mappings.length; i < len; i++) {
        mapping = mappings[i];
        next = "";
        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          while (mapping.generatedLine !== previousGeneratedLine) {
            next += ";";
            previousGeneratedLine++;
          }
        } else {
          if (i > 0) {
            if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
              continue;
            }
            next += ",";
          }
        }
        next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;
        if (mapping.source != null) {
          sourceIdx = this._sources.indexOf(mapping.source);
          next += base64VLQ.encode(sourceIdx - previousSource);
          previousSource = sourceIdx;
          next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;
          next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;
          if (mapping.name != null) {
            nameIdx = this._names.indexOf(mapping.name);
            next += base64VLQ.encode(nameIdx - previousName);
            previousName = nameIdx;
          }
        }
        result += next;
      }
      return result;
    };
    SourceMapGenerator2.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function(source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot != null) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
      }, this);
    };
    SourceMapGenerator2.prototype.toJSON = function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._file != null) {
        map.file = this._file;
      }
      if (this._sourceRoot != null) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }
      return map;
    };
    SourceMapGenerator2.prototype.toString = function SourceMapGenerator_toString() {
      return JSON.stringify(this.toJSON());
    };
    exports.SourceMapGenerator = SourceMapGenerator2;
  }
});

// src/transpiler.dak
var import_source_map_generator = __toESM(require_source_map_generator());
var symbolBreaker = ["(", ")", "[", "]", "{", "}"];
var single = [...symbolBreaker, "@", "#", ":", "'", "~", ","];
var whitespace = [" ", "\r", "\n", "	"];
var builtinMacros = `
(macro array? [v]
  '(Array.isArray ,v))

(macro boolean? [v]
  '(= (typeof ,v) :boolean))

(macro object? [v]
  '(= (typeof ,v) :object))

(macro number? [v]
  '(= (typeof ,v) :number))

(macro bigint? [v]
  '(= (typeof ,v) :bigint))

(macro string? [v]
  '(= (typeof ,v) :string))

(macro zero? [v]
  '(= ,v 0))

(macro pos? [v]
  '(> ,v 0))

(macro neg? [v]
  '(< ,v 0))

(macro true? [v]
  '(= ,v true))

(macro false? [v]
  '(= ,v false))

(macro undefined? [v]
  '(= (typeof ,v) :undefined))

(macro defined? [v]
  '(not= (typeof ,v) :undefined))

(macro isa? [v k]
  '(instanceof ,v ,k))

(macro null? [v]
  '(= ,v null))

(macro inc [v]
  '(+ ,v 1))

(macro dec [v]
  '(- ,v 1))

(macro when [cond ...body]
  '(if ,cond
     (do ,...body)))

(macro -> [v ...forms]
  (.reduce forms
           (fn [c f]
             (if (= f.kind :list)
               (do
                 (.splice f 1 0 c)
                 f)
               '(,f ,c)))
           v))

(macro if-let [[form tst] then el]
  '(let [temp# ,tst]
     (if temp#
       (let [,form temp#]
         ,then)
       ,el)))

(macro when-let [[form tst] ...body]
  '(let [temp# ,tst]
     (if temp#
       (let [,form temp#]
         ,...body))))

(macro doto [x ...forms]
  '(let [gx# ,x]
     ,(... (forms.map #(if (= $.kind :list)
                         '(,(. $ 0) gx# ,(... ($.splice 1)))
                         '(,$ gx#))))
     gx#))
`;
var get_DASH_source = (ctx) => {
  return ctx.source ?? "<anonymous>";
};
var err = (ctx, { pos = {} }, msg) => {
  {
    let e = Error(`${pos.source}:${pos.line + 1}:${pos.column + 1}: ${msg}`);
    e.pos = pos;
    return e;
  }
  ;
};
var partsStr = (gen) => {
  {
    let parts = [];
    for (let part of gen) {
      let hoist__0;
      if (typeof part === "string") {
        hoist__0 = part;
      } else {
        hoist__0 = part[0];
      }
      ;
      parts.push(hoist__0);
    }
    ;
    return parts.join("");
  }
  ;
};
var bindings = (initial) => {
  return { scopes: [{}, initial], push: (function() {
    return this.scopes.unshift({});
  }), pop: (function() {
    return this.scopes.shift();
  }), add: (function(name, value) {
    return this.scopes[0][name] = value ?? true;
  }), get: (function(name) {
    for (let scope of this.scopes) {
      {
        let macro__1 = scope[name];
        if (macro__1) {
          {
            let binding = macro__1;
            return binding;
          }
        }
        ;
      }
      ;
    }
    ;
  }) };
};
var readString = (ctx, quote, input, len, pos) => {
  {
    let buf = [];
    let orig = { ...pos };
    let start = pos.offset + 1;
    for (let end = start; end < len; end++) {
      pos.offset++;
      pos.column++;
      switch (input[end]) {
        case quote:
          pos.offset++;
          pos.column++;
          if (buf.length === 0) {
            return input.substring(start, end);
          } else {
            buf.push(input.substring(start, end));
            return buf.join("");
          }
          ;
          ;
          break;
        case "\n":
          pos.line++;
          pos.column = 0;
          buf.push(input.substring(start, end), "\\n");
          start = end + 1;
          ;
          break;
        case "\\":
          end++;
          pos.offset++;
          if (input[end] === "\n") {
            pos.line++;
            pos.column = 0;
          } else {
            pos.column += 2;
          }
          ;
          ;
          break;
      }
      ;
    }
    ;
    throw err(ctx, { pos: orig }, "unterminated string");
  }
  ;
};
var isLetter = (c) => {
  return c >= "A" && c <= "Z" || c >= "a" && c <= "z";
};
var readRegexp = (ctx, input, len, pos) => {
  {
    let start = pos.offset + 1;
    for (let end = start; end < len; end++) {
      pos.offset++;
      pos.column++;
      switch (input[end]) {
        case "/":
          pos.offset++;
          pos.column++;
          while (end++ < len) {
            if (!isLetter(input[end])) {
              return input.substring(start - 1, end);
            }
            ;
            pos.offset++;
            pos.column++;
          }
          ;
          ;
          break;
        case "\\":
          end++;
          pos.offset++;
          pos.column++;
          ;
          break;
      }
      ;
    }
    ;
  }
  ;
  throw err(ctx, ctx, "unterminated regex");
};
var readSymbol = (ctx, input, len, pos) => {
  {
    let start = pos.offset;
    for (let end = start; end < len; end++) {
      {
        let c = input[end];
        if (symbolBreaker.includes(c) || whitespace.includes(c) || c === ";") {
          return input.substring(start, end);
        }
        ;
      }
      ;
      pos.offset++;
      pos.column++;
    }
    ;
    return input.substring(start, len);
  }
  ;
};
var readEOL = (ctx, input, len, pos) => {
  {
    let start = pos.offset;
    for (let end = start; end < len; end++) {
      pos.offset++;
      pos.column++;
      if (input[end] === "\n") {
        pos.line++;
        pos.column = 0;
        return input.substring(start, end);
      }
      ;
    }
    ;
    return input.substring(start, len);
  }
  ;
};
var tokens = function* (ctx, input) {
  {
    let pos = { offset: 0, line: 0, column: 0, source: get_DASH_source(ctx) };
    let len = input.length;
    let value = null;
    let start = null;
    ctx.pos = { ...pos };
    while (pos.offset < len) {
      {
        let c = input[pos.offset];
        if (c === "\n") {
          pos.line++;
          pos.column = 0;
          ctx.pos = { ...pos };
          yield { kind: "newline", value: "\n", pos };
          pos.offset++;
          continue;
        }
        ;
        if (whitespace.includes(c)) {
          pos.offset++;
          pos.column++;
          continue;
        }
        ;
        if (pos.offset === 0 && c === "#" && input[1] === "!") {
          readEOL(ctx, input, len, pos);
          continue;
        }
        ;
        if (single.includes(c)) {
          if (c === "#" && input[pos.offset + 1] === "/") {
            pos.offset++;
            pos.column++;
            start = { ...pos };
            value = readRegexp(ctx, input, len, pos);
            ctx.pos = { ...start };
            yield { kind: "regexp", value, pos: start };
          } else {
            ctx.pos = { ...pos };
            yield { kind: c, pos: { ...pos } };
            pos.offset++;
            pos.column++;
          }
          ;
          continue;
        }
        ;
        switch (c) {
          case '"':
            start = { ...pos };
            value = readString(ctx, '"', input, len, pos);
            ctx.pos = { ...start };
            yield { kind: "string", value, pos: start };
            ;
            break;
          case "`":
            start = { ...pos };
            value = readString(ctx, "`", input, len, pos);
            ctx.pos = { ...start };
            yield { kind: "template", value, pos: start };
            ;
            break;
          case ";":
            start = { ...pos };
            value = readEOL(ctx, input, len, pos);
            ctx.pos = { ...start };
            yield { kind: "comment", value, pos: start };
            ;
            break;
          default:
            start = { ...pos };
            value = readSymbol(ctx, input, len, pos);
            ctx.pos = { ...start };
            yield { kind: "symbol", value, pos: start };
            ;
            break;
        }
        ;
      }
      ;
    }
    ;
  }
  ;
};
var whitespaceOrComment = ({ kind }) => {
  return kind === "comment" || kind === "newline";
};
var setKind = (o, kind, { pos }) => {
  {
    let macro__2 = o;
    Object.defineProperty(macro__2, "kind", { value: kind, enumerable: false });
    Object.defineProperty(macro__2, "pos", { value: pos, enumerable: false });
    return macro__2;
  }
  ;
};
var astUntil = function* (ctx, input, kind, name) {
  {
    let start = { ...ctx.pos };
    for (let token of input) {
      if (whitespaceOrComment(token)) {
        continue;
      }
      ;
      if (token.kind === kind) {
        return;
      }
      ;
      yield astOne(ctx, prepend(token, input));
    }
    ;
    throw err(ctx, { pos: start }, `unterminated ${name}`);
  }
  ;
};
var astNeedOne = (ctx, input, special) => {
  {
    let start = { ...ctx.pos };
    {
      let macro__0 = astOne(ctx, input);
      if (macro__0) {
        {
          let node = macro__0;
          return node;
        }
      } else {
        throw err(ctx, { pos: start }, `unterminated ${special}`);
      }
      ;
    }
    ;
  }
  ;
};
var astShorthand = (ctx, token, special, input) => {
  return setKind([{ kind: "symbol", pos: token.pos, value: special }, astNeedOne(ctx, input, special)], "list", token);
};
var astHash = (ctx, token, input) => {
  {
    let node = astShorthand(ctx, token, "hash", input);
    if (node.length === 2 && node[1].kind === "symbol") {
      return { kind: "symbol", value: "#" + node[1].value, pos: node.pos };
    } else {
      return node;
    }
    ;
  }
  ;
};
var astOne = (ctx, input) => {
  while (true) {
    {
      let { value, done } = input.next();
      if (done) {
        return;
      }
      ;
      switch (value.kind) {
        case "newline":
        case "comment":
          continue;
          break;
        case "string":
        case "template":
        case "regexp":
        case "symbol":
          return value;
          break;
        case "(":
          return setKind([...astUntil(ctx, input, ")", "list")], "list", value);
          break;
        case "[":
          return setKind([...astUntil(ctx, input, "]", "array")], "array", value);
          break;
        case "{":
          return setKind([...astUntil(ctx, input, "}", "object")], "object", value);
          break;
        case "'":
          return astShorthand(ctx, value, "quote", input);
          break;
        case ",":
          return astShorthand(ctx, value, "unquote", input);
          break;
        case "@":
          return astShorthand(ctx, value, "await", input);
          break;
        case "#":
          return astHash(ctx, value, input);
          break;
        case ":":
          {
            let sym = astNeedOne(ctx, input, "keyword");
            if (sym.kind !== "symbol") {
              throw err(ctx, value, "invalid keyword");
            }
            ;
            sym.kind = "string";
            sym.pos = value.pos;
            return sym;
          }
          ;
          break;
        default:
          throw err(ctx, value, `unknown token ${value.kind}`);
          break;
      }
      ;
    }
    ;
  }
  ;
};
var uninterrupt = (it) => {
  return { next: (() => {
    return it.next();
  }), [Symbol.iterator]: (function() {
    return this;
  }) };
};
var prepend = (one, rest) => {
  return uninterrupt((function* () {
    yield one;
    return yield* rest;
  })());
};
var evExpr = "evExpr";
var evStat = "evStat";
var hoister = (ctx) => {
  const collected = [];
  ;
  const hoist = (transpile2, node, givenAssign) => {
    {
      let sym = [...transpileNodeSymbol(ctx, ctx.gensym("hoist"))];
      let assign = [...sym, "="];
      collected.push("let ", ...sym, ";", ...transpile2(ctx, node, assign, hoist, evStat), ";");
      return [...transpileSpecialAssign(ctx, givenAssign), ...sym];
    }
    ;
  };
  return [hoist, collected];
};
var hoistable = (transpile2) => {
  return (function* (ctx, node, assign, _hoist, evKind) {
    {
      let [hoist, hoisted] = hoister(ctx);
      let postHoist = [...transpile2(ctx, node, assign, hoist, evKind)];
      yield* hoisted;
      return yield* postHoist;
    }
    ;
  });
};
var splitter = (s) => {
  let first = true;
  return (() => {
    if (first) {
      first = false;
      return "";
    } else {
      return s;
    }
    ;
  });
};
var isValidIdentifier = (s) => {
  return s.match(/^[a-zA-Z_$][0-9a-zA-Z_$]*$/);
};
var canLiteralIdentifier = (node) => {
  return node.kind === "string" && isValidIdentifier(node.value);
};
var transpileNodeObject = function* (ctx, node, hoist) {
  yield ["{", node];
  for (let i = 0; i < node.length; i++) {
    if (node[i].kind === "symbol" && node[i].value.startsWith("...")) {
      yield* transpileNodeSymbol(ctx, node[i]);
    } else if (node[i].kind === "list" && node[i][0].kind === "symbol" && node[i][0].value === "...") {
      yield ["...", node[i]];
      yield* transpileNodeExpr(ctx, node[i][1], null, hoist, evExpr);
    } else {
      if (canLiteralIdentifier(node[i])) {
        yield [node[i].value, node[i]];
      } else {
        yield "[";
        yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr);
        yield "]";
      }
      ;
      yield ":";
      yield* transpileNodeExpr(ctx, node[i + 1], null, hoist, evExpr);
      i++;
    }
    ;
    yield ",";
  }
  ;
  return yield "}";
};
var transpileNodeArray = function* (ctx, node, hoist) {
  yield ["[", node];
  for (let i of node) {
    yield* transpileNodeExpr(ctx, i, null, hoist, evExpr);
    yield ",";
  }
  ;
  return yield "]";
};
var transpileNodeString = function* (ctx, token) {
  yield ['"', token];
  yield token.value;
  return yield '"';
};
var exprStart = "${";
var exprEnd = "}";
var templateExprStart = (template, position) => {
  {
    let index = template.indexOf(exprStart, position);
    if (index === -1) {
      return -1;
    } else if (index === 0) {
      return exprStart.length;
    } else if (template[index - 1] === "\\") {
      return templateExprStart(template, index);
    } else {
      return index + exprStart.length;
    }
    ;
  }
  ;
};
var transpileNodeTemplate = function* (ctx, token, hoist) {
  yield ["`", token];
  {
    let last = 0;
    let start = templateExprStart(token.value);
    while (start != -1) {
      yield [token.value.slice(last, start), token];
      last = token.value.indexOf(exprEnd, start);
      if (last === -1) {
        throw err(ctx, token, "invalid template literal");
      }
      ;
      yield* transpileCtx(token.value.slice(start, last), ctx, false);
      start = templateExprStart(token.value, start);
    }
    ;
    yield [token.value.slice(last), token];
    return yield "`";
  }
  ;
};
var transpileNodeRegExp = function* (ctx, token) {
  return yield [token.value, token];
};
var mangleChars = { ["!"]: "_BANG_", ["/"]: "_FSLASH_", ["\\"]: "_RSLASH_", ["?"]: "_QMARK_", ["*"]: "_STAR_", ["+"]: "_PLUS_", [">"]: "_GT_", ["<"]: "_LT_", ["="]: "_EQ_", ["-"]: "_DASH_" };
var mangleSym = (sym, autoThis = true) => {
  {
    let first = sym[0];
    if (first === "-") {
      return sym;
    }
    ;
    if (first === ".") {
      first = sym.at(1);
    }
    ;
    if (first >= "0" && first <= "9") {
      return sym;
    }
    ;
  }
  ;
  {
    let parts = [];
    let start = 0;
    if (autoThis && sym.startsWith("...#")) {
      parts.push("...this.#");
      start = 4;
    }
    ;
    for (let end = 0; end < sym.length; end++) {
      {
        let c = sym[end];
        if (autoThis && end === 0 && c === "#") {
          parts.push("this.");
        }
        ;
        {
          let macro__1 = mangleChars[c];
          if (macro__1) {
            {
              let found = macro__1;
              if (found && (c !== "?" || sym[end + 1] !== ".")) {
                parts.push(sym.slice(start, end), found);
                start = end + 1;
              }
              ;
            }
          }
          ;
        }
        ;
      }
      ;
    }
    ;
    if (parts.length === 0) {
      return sym;
    } else {
      parts.push(sym.slice(start, sym.length));
      return parts.join("");
    }
    ;
  }
  ;
};
var transpileNodeSymbol = function* (ctx, token) {
  return yield [mangleSym(token.value), token];
};
var transpileSpecialAssign = function* (ctx, assign) {
  if (assign) {
    if (typeof assign === "string") {
      return yield assign;
    } else {
      return yield* assign;
    }
    ;
  }
  ;
};
var transpileNodeUnknown = function* (ctx, node, assign, hoist, evExpr2) {
  if (node.kind === "list") {
    return yield* transpileNodeList(ctx, node, assign, hoist, evExpr2);
  } else {
    yield* transpileSpecialAssign(ctx, assign);
    switch (node.kind) {
      case "object":
        return yield* transpileNodeObject(ctx, node, hoist);
      case "array":
        return yield* transpileNodeArray(ctx, node, hoist);
      case "regexp":
        return yield* transpileNodeRegExp(ctx, node);
      case "string":
        return yield* transpileNodeString(ctx, node);
      case "template":
        return yield* transpileNodeTemplate(ctx, node, hoist);
      case "symbol":
        return yield* transpileNodeSymbol(ctx, node);
      default:
        throw err(ctx, node, `unhandled node "${node.kind}"`);
    }
    ;
  }
  ;
};
var transpileNodeExpr = transpileNodeUnknown;
var transpileNodeStatement = hoistable(transpileNodeUnknown);
var transpileBuiltinImportOne = function* (ctx, node) {
  {
    let defaultName = null;
    let asName = null;
    let inner = [];
    let needFrom = false;
    let comma = splitter(",");
    for (let i = 1; i < node.length; i++) {
      {
        let c = node[i];
        switch (c.kind) {
          case "array":
            for (let name of c) {
              inner.push(mangleSym(name.value));
            }
            ;
            break;
          case "symbol":
            defaultName = c;
            break;
          case "string":
            if (c.value !== "as") {
              throw err(ctx, c, `unexpected import string "${c.value}"`);
            }
            ;
            i++;
            asName = node[i];
            ;
            break;
          case "object":
            for (let i2 = 0; i2 < c.length; i2 += 2) {
              inner.push(`${mangleSym(c[i2].value)} as ${mangleSym(c[i2 + 1].value)}`);
            }
            ;
            break;
          default:
            throw err(ctx, c, "unexpected import");
            break;
        }
        ;
      }
      ;
    }
    ;
    yield ["import ", node];
    if (defaultName) {
      needFrom = true;
      yield comma();
      yield* transpileNodeSymbol(ctx, defaultName);
    }
    ;
    if (inner.length > 0) {
      needFrom = true;
      yield comma();
      yield "{";
      yield inner.join(",");
      yield "}";
    }
    ;
    if (asName) {
      needFrom = true;
      yield comma();
      yield ["* as ", asName];
      yield* transpileNodeSymbol(ctx, asName);
    }
    ;
    if (needFrom) {
      yield " from ";
    }
    ;
    yield* transpileNodeString(ctx, node[0]);
    return yield ";";
  }
  ;
};
var transpileBuiltinImport = function* (ctx, node, assign, hoist, evExpr2) {
  if (node[1].kind === "array") {
    for (let i = 1; i < node.length; i++) {
      yield* transpileBuiltinImportOne(ctx, node[i]);
    }
  } else {
    return yield* transpileSpecialCall(ctx, node, assign, hoist, evExpr2);
  }
  ;
};
var exportDefault = (ctx, node) => {
  if (node?.[1]?.value === "^:export") {
    {
      let prefix = [["export ", node[1]]];
      let index = 2;
      if (node?.[2]?.value === "^:default") {
        prefix.push(["default ", node[2]]);
        index++;
      }
      ;
      return [prefix, index];
    }
  } else {
    return [[], 1];
  }
  ;
};
var transpileBuiltinConst = hoistable((function* (ctx, node, assign, hoist) {
  {
    let [prefix, symIndex] = exportDefault(ctx, node);
    yield* prefix;
    yield [node[0].value, node[0]];
    yield " ";
    yield* transpileSpecialDestructure(ctx, node[symIndex]);
    yield "=";
    yield* transpileNodeExpr(ctx, node[symIndex + 1], null, hoist, evExpr);
    return yield ";";
  }
  ;
}));
var transpileBuiltinDef = function* (ctx, node, _assign, _hoist) {
  {
    let [prefix, symIndex] = exportDefault(ctx, node);
    let [hoist, hoisted] = hoister(ctx);
    let assign = [...transpileSpecialDestructure(ctx, node[symIndex]), "="];
    let postHoist = [...transpileNodeExpr(ctx, node[symIndex + 1], assign, hoist, evExpr)];
    yield* prefix;
    yield [node[0].value, node[0]];
    yield " ";
    if (hoisted.length > 0 || postHoist[0] !== assign[0]) {
      yield* transpileNodeSymbol(ctx, node[symIndex]);
      yield ";";
      yield* hoisted;
    }
    ;
    return yield* postHoist;
  }
  ;
};
var transpileSpecialBody = hoistable((function* (ctx, node, assign, hoist) {
  for (let i = 0; i < node.length; i++) {
    {
      let a = null;
      if (i === node.length - 1) {
        a = assign;
      }
      ;
      yield* transpileNodeStatement(ctx, node[i], a, hoist, evStat);
      yield ";";
    }
    ;
  }
  ;
}));
var transpileBuiltinDo = function* (ctx, node, assign, hoist, evKind) {
  return yield* transpileSpecialBody(ctx, node.slice(1), assign, hoist, evKind);
};
var transpileSpecialDestructure = function* (ctx, node) {
  switch (node.kind) {
    case "symbol":
      ctx.bindings.add(node.name);
      return yield* transpileNodeSymbol(ctx, node);
      ;
    case "array":
      yield ["[", node];
      for (let inner of node) {
        yield* transpileSpecialDestructure(ctx, inner);
        yield ",";
      }
      ;
      return yield "]";
      ;
    case "object":
      {
        let keys = [];
        let rename = {};
        let or = {};
        let comma = splitter(",");
        for (let i = 0; i < node.length; i += 2) {
          {
            let key = node[i];
            let value = node[i + 1];
            if (key.kind === "symbol") {
              rename[key.value] = value.value;
              if (!keys.includes(key.value)) {
                keys.push(key.value);
              }
              ;
              continue;
            }
            ;
            switch (key.value) {
              case "keys":
                for (let inner of value) {
                  keys.push(inner.value);
                }
                ;
                break;
              case "or":
                for (let j = 0; j < value.length; j += 2) {
                  or[value[j].value] = [...transpileNodeUnknown(ctx, value[j + 1])];
                  if (!keys.includes(value[j].value)) {
                    keys.push(value[j].value);
                  }
                  ;
                }
                ;
                break;
              default:
                throw err(ctx, node[i], `unexpected destructuring map op "${key.value}"`);
                break;
            }
            ;
          }
          ;
        }
        ;
        yield "{";
        for (let key of keys) {
          yield comma();
          yield mangleSym(key);
          if (Object.hasOwn(rename, key)) {
            yield ":";
            yield mangleSym(rename[key]);
            ctx.bindings.add(rename[key]);
          } else {
            ctx.bindings.add(key);
          }
          ;
          if (Object.hasOwn(or, key)) {
            yield "=";
            yield* or[key];
          }
          ;
        }
        ;
        return yield "}";
      }
      ;
    case "list":
      yield* transpileNodeUnknown(ctx, node[0]);
      yield "=";
      return yield* transpileNodeUnknown(ctx, node[1]);
      ;
    default:
      throw err(ctx, node, `unexpected destructure "${node.kind}"`);
  }
  ;
};
var transpileSpecialFnArgs = function* (ctx, node) {
  {
    let comma = splitter(",");
    yield "(";
    for (let i of node) {
      yield comma();
      yield* transpileSpecialDestructure(ctx, i);
    }
    ;
    return yield ")";
  }
  ;
};
var makeFnTranspiler = (preArgs, postArgs) => {
  return (function* (ctx, node, assign, _hoist, evKind) {
    {
      let pre = preArgs;
      let post = postArgs;
      let [prefix, index] = exportDefault(ctx, node);
      let decl = false;
      yield* transpileSpecialAssign(ctx, assign);
      yield* prefix;
      if (node[index].value === "^:decl") {
        decl = true;
        pre = "";
        post = "";
        index++;
      }
      ;
      {
        let named = node[index].kind === "symbol";
        let wrapped = evKind === evExpr || !named;
        if (wrapped) {
          yield "(";
        }
        ;
        if (decl) {
          if (preArgs === "") {
            yield ["function", node];
          } else if (preArgs === "async") {
            yield ["async function", node];
          }
          ;
        }
        ;
        if (named) {
          if (decl) {
            yield " ";
            yield* transpileNodeSymbol(ctx, node[index]);
          } else {
            yield ["const ", node];
            yield* transpileNodeSymbol(ctx, node[index]);
            yield "=";
          }
          ;
          ctx.bindings.add(node[index].value);
          index++;
        }
        ;
        yield pre;
        yield* transpileSpecialFnArgs(ctx, node[index]);
        yield post;
        yield "{";
        yield* transpileSpecialBody(ctx, node.slice(index + 1), "return ", null, evStat);
        yield "}";
        if (wrapped) {
          return yield ")";
        }
        ;
      }
      ;
    }
    ;
  });
};
var transpileBuiltinFnArrow = makeFnTranspiler("", "=>");
var transpileBuiltinFnArrowAsync = makeFnTranspiler("async", "=>");
var transpileBuiltinFnGenerator = makeFnTranspiler("function*", "");
var transpileBuiltinFnAsyncGenerator = makeFnTranspiler("async function*", "");
var makeOpTranspiler = (op, unary) => {
  return (function* (ctx, node, assign, hoist, _evKind) {
    yield* transpileSpecialAssign(ctx, assign);
    yield "(";
    if (unary && node.length === 2) {
      yield [op, node[0]];
    }
    ;
    {
      let sp = splitter([op, node[0]]);
      for (let i = 1; i < node.length; i++) {
        yield sp();
        yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr);
      }
      ;
    }
    ;
    return yield ")";
  });
};
var makePrefixOpTranspiler = (op) => {
  return (function* (ctx, node, assign, hoist, _evKind) {
    yield* transpileSpecialAssign(ctx, assign);
    yield "(";
    yield [op, node[0]];
    yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr);
    return yield ")";
  });
};
var makeSuffixOpTranspiler = (op) => {
  return (function* (ctx, node, assign, hoist, _evKind) {
    yield* transpileSpecialAssign(ctx, assign);
    yield "(";
    yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr);
    yield [op, node[0]];
    return yield ")";
  });
};
var cmpRemap = { ["="]: "===", ["not="]: "!==" };
var transpileBuiltinCmp = function* (ctx, node, assign, hoist, _evKind) {
  yield* transpileSpecialAssign(ctx, assign);
  yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr);
  {
    let op = node[0].value;
    yield [cmpRemap[op] ?? op, node[0]];
  }
  ;
  return yield* transpileNodeExpr(ctx, node[2], null, hoist, evExpr);
};
var transpileBuiltinLet = function* (ctx, node, assign, hoist, evKind) {
  if (node[1].kind === "array") {
    return yield* transpileBuiltinLetMulti(ctx, node, assign, hoist, evKind);
  } else {
    return yield* transpileBuiltinDef(ctx, node, assign, hoist, evKind);
  }
  ;
};
var transpileBuiltinLetMulti = function* (ctx, node, assign, hoist, evKind) {
  if (evKind === evExpr) {
    yield* hoist(transpileBuiltinLetMulti, node, assign);
    return;
  }
  ;
  ctx.bindings.push();
  yield "{";
  for (let i = 0; i < node[1].length; i += 2) {
    {
      let binding = node[1][i];
      let sym = null;
      if (binding.kind === "symbol") {
        ctx.bindings.add(binding.value);
        sym = [...transpileNodeSymbol(ctx, binding)];
      } else {
        sym = [...transpileNodeSymbol(ctx, ctx.gensym("let_multi"))];
      }
      ;
      {
        let assign2 = [...sym, "="];
        let one = [...transpileNodeStatement(ctx, node[1][i + 1], assign2, hoist, evStat)];
        if (one[0] === assign2[0]) {
          if (binding.kind !== "symbol") {
            yield ["let ", node];
            yield* transpileSpecialDestructure(ctx, binding);
            yield "=";
            yield* one.slice(2);
          } else {
            yield ["let ", node];
            yield* one;
          }
          ;
          yield ";";
          continue;
        }
        ;
        yield "let ";
        yield* sym;
        yield ";";
        yield* one;
        yield ";";
        if (binding.kind !== "symbol") {
          yield "let ";
          yield* transpileSpecialDestructure(ctx, binding);
          yield "=";
          yield* sym;
          yield ";";
        }
        ;
      }
      ;
    }
    ;
  }
  ;
  yield* transpileSpecialBody(ctx, node.slice(2), assign, hoist, evStat);
  yield "}";
  return ctx.bindings.pop();
};
var transpileBuiltinKeywordExpr = function* (ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign);
  if (evKind === evExpr) {
    yield "(";
  }
  ;
  yield [node[0].value, node];
  if (node.length !== 1) {
    yield " ";
    yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr);
  }
  ;
  if (evKind === evExpr) {
    return yield ")";
  }
  ;
};
var transpileBuiltinKeywordStatement = function* (ctx, node, _assign, hoist, _evKind) {
  if (node.length === 1) {
    return yield [node[0].value, node];
  } else {
    return yield* transpileNodeStatement(ctx, node[1], [node[0].value, " "], hoist, evStat);
  }
  ;
};
var transpileBuiltinFor = function* (ctx, node, _assign, hoist, _evKind) {
  {
    let binding = node[1];
    yield "for(let ";
    yield* transpileNodeSymbol(ctx, binding[0]);
    yield "=";
    yield* transpileNodeExpr(ctx, binding[1], null, hoist, evExpr);
    yield ";";
    yield* transpileNodeSymbol(ctx, binding[0]);
    yield "<";
    yield* transpileNodeExpr(ctx, binding[2], null, hoist, evExpr);
    yield ";";
    yield* transpileNodeSymbol(ctx, binding[0]);
    if (binding.length === 3) {
      yield "++";
    } else {
      yield "+=";
      yield* transpileNodeExpr(ctx, binding[3], null, hoist, evExpr);
    }
    ;
    yield "){";
    yield* transpileSpecialBody(ctx, node.slice(2), null, hoist, evStat);
    return yield "}";
  }
  ;
};
var makeForTranspiler = (prefix, middle) => {
  return (function* (ctx, node, _assign, hoist, evKind) {
    {
      let binding = node[1];
      yield [prefix, node[0]];
      yield "(let ";
      yield* transpileSpecialDestructure(ctx, binding[0]);
      yield [" ", node[0]];
      yield middle;
      yield " ";
      yield* transpileNodeExpr(ctx, binding[1], null, hoist, evExpr);
      yield ["){", node[0]];
      yield* transpileSpecialBody(ctx, node.slice(2), null, hoist, evStat);
      return yield "}";
    }
    ;
  });
};
var transpileBuiltinForOf = makeForTranspiler("for", "of");
var transpileBuiltinForIn = makeForTranspiler("for", "in");
var transpileBuiltinForAwait = makeForTranspiler("for await", "of");
var transpileBuiltinIf = function* (ctx, node, assign, hoist, evKind) {
  if (evKind === evExpr) {
    yield* hoist(transpileBuiltinIf, node, assign);
    return;
  }
  ;
  {
    let elif = splitter("else ");
    let finalElse = node.length % 2 === 0;
    for (let i = 1; i < node.length; i += 2) {
      if (finalElse && i === node.length - 1) {
        yield "else{";
        yield* transpileNodeStatement(ctx, node[i], assign, hoist, evStat);
        yield "}";
        return;
      }
      ;
      yield elif();
      yield ["if(", node[0]];
      yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr);
      yield "){";
      yield* transpileNodeStatement(ctx, node[i + 1], assign, hoist, evStat);
      yield "}";
    }
    ;
  }
  ;
};
var transpileBuiltinWhile = function* (ctx, node, assign, hoist, evKind) {
  if (evKind === evExpr) {
    yield* hoist(transpileBuiltinWhile, node, assign);
    return;
  }
  ;
  yield ["while(", node];
  yield* transpileNodeExpr(ctx, node[1], null, evExpr);
  yield "){";
  yield* transpileSpecialBody(ctx, node.slice(2), null, hoist, evStat);
  return yield "}";
};
var transpileBuiltinCase = function* (ctx, node, assign, hoist, evKind) {
  if (evKind === evExpr && !assign) {
    yield* hoist(transpileBuiltinCase, node, assign);
    return;
  }
  ;
  {
    let finalDefault = node.length % 2 > 0;
    yield ["switch (", node];
    yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr);
    yield "){";
    for (let i = 2; i < node.length; i += 2) {
      if (finalDefault && i === node.length - 1) {
        yield "default:";
        yield* transpileNodeStatement(ctx, node[i], assign, hoist, evStat);
        yield ";";
        if (assign !== "return ") {
          yield "break";
        }
        ;
        yield "}";
        return;
      }
      ;
      if (node[i].kind === "array") {
        for (let j = 0; j < node[i].length; j++) {
          yield ["case ", node[i][j]];
          yield* transpileNodeExpr(ctx, node[i][j], null, hoist, evExpr);
          yield [":", node[i][j]];
        }
      } else {
        yield ["case ", node[i]];
        yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr);
        yield [":", node[i]];
      }
      ;
      yield* transpileNodeStatement(ctx, node[i + 1], assign, hoist, evStat);
      yield ";";
      if (assign !== "return ") {
        yield "break;";
      }
      ;
    }
    ;
    return yield "}";
  }
  ;
};
var transpileBuiltinQuestionDot = function* (ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign);
  yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr);
  for (let i = 2; i < node.length; i++) {
    yield "?.";
    if (canLiteralIdentifier(node[i])) {
      yield [node[i].value, node[i]];
    } else {
      yield "[";
      yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr);
      yield "]";
    }
    ;
  }
  ;
};
var transpileBuiltinDot = function* (ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign);
  yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr);
  for (let i = 2; i < node.length; i++) {
    if (canLiteralIdentifier(node[i])) {
      yield ".";
      yield [node[i].value, node[i]];
    } else {
      yield "[";
      yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr);
      yield "]";
    }
    ;
  }
  ;
};
var transpileBuiltinRest = function* (ctx, node, assign, hoist, evKind) {
  yield ["...", node];
  return yield* transpileNodeStatement(ctx, node[1], assign, hoist, evKind);
};
var transpileBuiltinTry = function* (ctx, node, assign, hoist, evKind) {
  if (evKind === evExpr) {
    yield* hoist(transpileBuiltinTry, node, assign);
    return;
  }
  ;
  {
    let end = node.length;
    let ctch = null;
    let final = null;
    if (node?.[end - 1]?.[0]?.value === "finally") {
      final = node[end - 1];
      end--;
    }
    ;
    if (node?.[end - 1]?.[0]?.value === "catch") {
      ctch = node[end - 1];
      end--;
    }
    ;
    if (!final && !ctch) {
      throw err(ctx, node, "at least one of catch or finally is required");
    }
    ;
    yield ["try{", node];
    yield* transpileSpecialBody(ctx, node.slice(1, end), assign, hoist, evStat);
    yield "}";
    if (ctch) {
      yield ["catch(", ctch];
      yield* transpileNodeExpr(ctx, ctch[1], null, null, evExpr);
      yield "){";
      yield* transpileSpecialBody(ctx, ctch.slice(2), assign, null, evStat);
      yield "}";
    }
    ;
    if (final) {
      yield ["finally{", final];
      yield* transpileSpecialBody(ctx, final.slice(1), null, null, evStat);
      return yield "}";
    }
    ;
  }
  ;
};
var transpileClassStatic = function* (ctx, node) {
  yield ["static{", node];
  yield* transpileSpecialBody(ctx, node.slice(1), null, null, evStat);
  return yield "}";
};
var transpileClassPrivateSymbol = function* (ctx, token) {
  return yield [mangleSym(token.value, false), token];
};
var transpileClassLet = function* (ctx, node, _assign, _hoist) {
  {
    let index = 1;
    let stic = false;
    if (node[index].value === "^:static") {
      stic = true;
      yield ["static ", node[index]];
      index++;
    }
    ;
    if (node[index].kind === "array") {
      {
        let count = node[index].length;
        for (let sym of node[index]) {
          yield* transpileClassPrivateSymbol(ctx, sym);
          yield ";";
          count--;
          if (stic && count > 0) {
            yield "static ";
          }
          ;
        }
        ;
      }
      ;
      return;
    }
    ;
    yield* transpileClassPrivateSymbol(ctx, node[index]);
    index++;
    if (node[index]) {
      yield "=";
      yield* transpileNodeExpr(ctx, node[index], null, null, evExpr);
    }
    ;
    return yield ";";
  }
  ;
};
var makeClassFnTranspiler = (pre) => {
  return (function* (ctx, node) {
    {
      let index = 1;
      if (node[index].value === "^:static") {
        yield ["static ", node[index++]];
      }
      ;
      if (node[index].value === "^:get") {
        yield ["get ", node[index++]];
      } else if (node[index].value === "^:set") {
        yield ["set ", node[index++]];
      } else {
        yield [pre, node];
      }
      ;
      yield* transpileClassPrivateSymbol(ctx, node[index++]);
      yield* transpileSpecialFnArgs(ctx, node[index++]);
      yield "{";
      yield* transpileSpecialBody(ctx, node.slice(index++), "return ", null, evStat);
      return yield "}";
    }
    ;
  });
};
var transpileClassFnArrow = makeClassFnTranspiler("");
var transpileClassFnArrowAsync = makeClassFnTranspiler("async ");
var transpileClassFnGenerator = makeClassFnTranspiler("*");
var transpileClassFnAsyncGenerator = makeClassFnTranspiler("async *");
var classBuiltins = { let: transpileClassLet, fn: transpileClassFnArrow, ["fn@"]: transpileClassFnArrowAsync, ["fn*"]: transpileClassFnGenerator, ["fn@*"]: transpileClassFnAsyncGenerator, static: transpileClassStatic };
var transpileClassNodeList = function* (ctx, node, assign, hoist, evKind) {
  {
    let call = node[0].value;
    {
      let macro__1 = classBuiltins[call];
      if (macro__1) {
        {
          let builtin = macro__1;
          yield* builtin(ctx, node, assign, hoist, evKind);
          return;
        }
      }
      ;
    }
    ;
    {
      let macro__1 = ctx.macros.get(call);
      if (macro__1) {
        {
          let macro = macro__1;
          yield* transpileClassNodeList(ctx, macro(...node), assign, hoist, evKind);
          return;
        }
      }
      ;
    }
    ;
  }
  ;
  throw err(ctx, node[0], `unexpected class body "${node[0].kind}"`);
};
var transpileBuiltinClass = function* (ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign);
  {
    let [prefix, index] = exportDefault(ctx, node);
    yield* prefix;
    yield ["class", node[0]];
    if (node?.[index]?.kind === "symbol") {
      yield " ";
      yield* transpileNodeSymbol(ctx, node[index]);
      ctx.bindings.add(node[index].value);
      index++;
    }
    ;
    if (node?.[index]?.kind === "string" && node?.[index]?.value === "extends") {
      yield [" extends ", node[index]];
      yield* transpileNodeExpr(ctx, node[index + 1], null, hoist, evExpr);
      index += 2;
    }
    ;
    yield "{";
    for (let i = index; i < node.length; i++) {
      yield* transpileClassNodeList(ctx, node[i], null, null, evStat);
    }
    ;
    return yield "}";
  }
  ;
};
var hashLambdaArgMap = (ctx, args, n) => {
  if (Array.isArray(n) && n?.[0]?.value !== "hash") {
    n.forEach(((lambda__8) => {
      return hashLambdaArgMap(ctx, args, lambda__8);
    }));
    return;
  } else if (n.kind !== "symbol") {
    return;
  } else if (n.value.startsWith("...$")) {
    if (!args.rest) {
      args.rest = ctx.gensym("lambda_rest");
    }
    ;
    n.value = `${args.rest.value}${n.value.slice(4)}`;
    return;
  } else if (!n.value.startsWith("$")) {
    return;
  }
  ;
  {
    let sym = n.value;
    let dot = sym.indexOf(".");
    let target;
    if (dot < 0) {
      target = sym;
    } else {
      target = sym.slice(0, dot);
    }
    ;
    let question = target.endsWith("?");
    let middle = "";
    let arg = 0;
    if (question) {
      target = target.slice(0, -1);
      middle = "?";
    }
    ;
    if (target !== "$") {
      arg = parseInt(target.slice(1), 10) - 1;
    }
    ;
    for (let i = 0; i < arg + 1; i++) {
      if (!args[i]) {
        args[i] = ctx.gensym("lambda");
      }
      ;
    }
    ;
    {
      let replace = args[arg].value;
      let hoist__9;
      if (dot < 0) {
        hoist__9 = replace;
      } else {
        hoist__9 = `${replace}${middle}${sym.slice(dot)}`;
      }
      ;
      return n.value = hoist__9;
    }
    ;
  }
  ;
};
var transpileHashLambda = function* (ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign);
  {
    let args = [];
    let comma = splitter(",");
    hashLambdaArgMap(ctx, args, node[1]);
    yield "((";
    for (let arg of args) {
      yield comma();
      yield* transpileNodeSymbol(ctx, arg);
    }
    ;
    if (args.rest) {
      yield comma();
      yield "...";
      yield* transpileNodeSymbol(ctx, args.rest);
    }
    ;
    yield ")=>{";
    yield* transpileNodeStatement(ctx, node[1], "return ", hoist, evStat);
    return yield "})";
  }
  ;
};
var transpileBuiltinHash = function* (ctx, node, assign, hoist, evKind) {
  if (node[1].kind === "list") {
    return yield* transpileHashLambda(ctx, node, assign, hoist, evKind);
  } else {
    throw err(ctx, ctx, `unexpected hash "${node[1].kind}"`);
  }
  ;
};
var serializeNode = function* (ctx, node, hoist) {
  if (Array.isArray(node)) {
    if (node?.[0]?.value === "unquote") {
      return yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr);
    } else {
      yield "Object.defineProperties([";
      for (let i of node) {
        yield* serializeNode(ctx, i, hoist);
        yield ",";
      }
      ;
      yield "],";
      yield JSON.stringify({ kind: { value: node.kind, enumerable: false }, pos: { value: node.pos, enumerable: false } });
      return yield ")";
    }
  } else {
    return yield JSON.stringify(node);
  }
  ;
};
var applyGensym = (ctx, existing, node) => {
  if (Array.isArray(node)) {
    return node.forEach(((lambda__10) => {
      return applyGensym(ctx, existing, lambda__10);
    }));
  } else if (node.kind === "symbol" && node.value.includes("#")) {
    {
      let [gen_DASH_name, suffix] = node.value.split("#");
      {
        let macro__0 = existing[gen_DASH_name];
        if (macro__0) {
          {
            let found = macro__0;
            return node.value = found + suffix;
          }
        } else {
          {
            let gen = ctx.gensym("macro").value;
            existing[gen_DASH_name] = gen;
            return node.value = gen + suffix;
          }
        }
        ;
      }
      ;
    }
  }
  ;
};
var transpileBuiltinQuote = function* (ctx, node, assign, hoist, _evKind) {
  applyGensym(ctx, {}, node);
  yield* transpileSpecialAssign(ctx, assign);
  return yield* serializeNode(ctx, node[1], hoist);
};
var transpileSpecialMacro = function* (ctx, node) {
  {
    let args = node[2].map(((lambda__12) => {
      return partsStr(transpileSpecialDestructure(ctx, lambda__12));
    }));
    let body = partsStr(transpileSpecialBody(ctx, node.slice(3), "return "));
    return ctx.macros.add(node[1].value, new Function("_macroName", ...args, body));
  }
  ;
};
var transpileSpecialCall = function* (ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign);
  {
    let argStart = 1;
    if (node[0].kind === "symbol") {
      {
        let call = node[0].value;
        if (call.endsWith(".")) {
          yield ["new ", node[0]];
          yield [mangleSym(call.slice(0, -1)), node[0]];
        } else if (call.startsWith(".")) {
          yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr);
          yield [mangleSym(call), node[0]];
          argStart = 2;
        } else {
          yield [mangleSym(call), node];
        }
        ;
      }
    } else {
      yield* transpileNodeExpr(ctx, node[0], null, hoist, evExpr);
    }
    ;
    {
      let comma = splitter(",");
      yield "(";
      for (let i = argStart; i < node.length; i++) {
        yield comma();
        yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr);
      }
      ;
      return yield ")";
    }
    ;
  }
  ;
};
var transpileNodeList = function* (ctx, node, assign, hoist, evKind) {
  {
    let call = node[0].value;
    let binding = ctx.bindings.get(call);
    if (binding === true) {
      yield* transpileSpecialCall(ctx, node, assign, hoist, evKind);
      return;
    }
    ;
    if (binding) {
      yield* binding(ctx, node, assign, hoist, evKind);
      return;
    }
    ;
    {
      let macro__1 = ctx.macros.get(call);
      if (macro__1) {
        {
          let macro = macro__1;
          yield* transpileNodeUnknown(ctx, macro(...node), assign, hoist, evKind);
          return;
        }
      }
      ;
    }
    ;
  }
  ;
  return yield* transpileSpecialCall(ctx, node, assign, hoist, evKind);
};
var transpileBuiltinTypeof = function* (ctx, node, assign, hoist, _evKind) {
  yield ["typeof ", node[0]];
  return yield* transpileNodeExpr(ctx, node[1], assign, hoist, evExpr);
};
var transpileBuiltinInstanceof = function* (ctx, node, assign, hoist, _evKind) {
  yield* transpileNodeExpr(ctx, node[1], assign, hoist, evExpr);
  yield [" instanceof ", node[0]];
  return yield* transpileNodeExpr(ctx, node[2], assign, hoist, evExpr);
};
var transpileBuiltinDelete = function* (ctx, node, assign, hoist, _evKind) {
  yield ["delete ", node[0]];
  return yield* transpileNodeExpr(ctx, node[1], assign, hoist, evExpr);
};
var transpileBuiltinSet = function* (ctx, node, assign, hoist, _evKind) {
  return yield* transpileNodeExpr(ctx, node[2], [...transpileNodeExpr(ctx, node[1], assign, hoist, evExpr), "="], hoist, evExpr);
};
var builtins = { import: transpileBuiltinImport, const: transpileBuiltinConst, var: transpileBuiltinDef, fn: transpileBuiltinFnArrow, ["fn@"]: transpileBuiltinFnArrowAsync, ["fn*"]: transpileBuiltinFnGenerator, ["fn@*"]: transpileBuiltinFnAsyncGenerator, str: makeOpTranspiler("+"), ["+"]: makeOpTranspiler("+", true), ["-"]: makeOpTranspiler("-", true), ["*"]: makeOpTranspiler("*"), ["/"]: makeOpTranspiler("/"), ["**"]: makeOpTranspiler("**"), ["%"]: makeOpTranspiler("%"), ["+="]: makeOpTranspiler("+="), ["-="]: makeOpTranspiler("-="), ["&="]: makeOpTranspiler("&="), ["|="]: makeOpTranspiler("|="), ["/="]: makeOpTranspiler("/="), ["*="]: makeOpTranspiler("*="), ["**="]: makeOpTranspiler("**="), ["<<="]: makeOpTranspiler("<<="), [">>="]: makeOpTranspiler(">>="), [">>>="]: makeOpTranspiler(">>>="), ["||="]: makeOpTranspiler("||="), ["??="]: makeOpTranspiler("??="), ["%="]: makeOpTranspiler("%="), ["??"]: makeOpTranspiler("??"), ["<<"]: makeOpTranspiler("<<"), [">>"]: makeOpTranspiler(">>"), [">>>"]: makeOpTranspiler(">>>"), ["++"]: makeSuffixOpTranspiler("++"), ["--"]: makeSuffixOpTranspiler("--"), ["bit-and"]: makeOpTranspiler("&"), ["bit-or"]: makeOpTranspiler("|"), ["bit-not"]: makePrefixOpTranspiler("~"), ["bit-xor"]: makeOpTranspiler("^"), ["||"]: makeOpTranspiler("||"), or: makeOpTranspiler("||"), ["&&"]: makeOpTranspiler("&&"), and: makeOpTranspiler("&&"), not: makePrefixOpTranspiler("!"), in: makeOpTranspiler(" in "), ["="]: transpileBuiltinCmp, ["=="]: transpileBuiltinCmp, ["!="]: transpileBuiltinCmp, ["not="]: transpileBuiltinCmp, ["<"]: transpileBuiltinCmp, [">"]: transpileBuiltinCmp, ["<="]: transpileBuiltinCmp, [">="]: transpileBuiltinCmp, let: transpileBuiltinLet, throw: transpileBuiltinKeywordStatement, return: transpileBuiltinKeywordStatement, yield: transpileBuiltinKeywordExpr, ["yield*"]: transpileBuiltinKeywordExpr, break: transpileBuiltinKeywordStatement, continue: transpileBuiltinKeywordStatement, await: transpileBuiltinKeywordExpr, for: transpileBuiltinFor, ["for@"]: transpileBuiltinForAwait, ["for-of"]: transpileBuiltinForOf, ["for-in"]: transpileBuiltinForIn, case: transpileBuiltinCase, do: transpileBuiltinDo, if: transpileBuiltinIf, while: transpileBuiltinWhile, ["."]: transpileBuiltinDot, ["?."]: transpileBuiltinQuestionDot, ["..."]: transpileBuiltinRest, typeof: transpileBuiltinTypeof, instanceof: transpileBuiltinInstanceof, set: transpileBuiltinSet, delete: transpileBuiltinDelete, hash: transpileBuiltinHash, quote: transpileBuiltinQuote, macro: transpileSpecialMacro, try: transpileBuiltinTry, class: transpileBuiltinClass };
var macros = {};
var newCtx = (config, macros2) => {
  let gensym = 0;
  return { ...config, bindings: bindings(builtins), macros: bindings(macros2), gensym: ((prefix) => {
    prefix = prefix ?? "gensym";
    return { kind: "symbol", value: `${prefix}__${gensym++}`, pos: {} };
  }) };
};
macros = (() => {
  {
    let ctx = newCtx({ source: "builtin-macros.dak" }, {});
    let input = uninterrupt(tokens(ctx, builtinMacros));
    while (true) {
      {
        let macro__0 = astOne(ctx, input);
        if (macro__0) {
          {
            let node = macro__0;
            [...transpileNodeStatement(ctx, node, null, null, evStat)];
          }
        } else {
          return ctx.macros.scopes[0];
        }
        ;
      }
      ;
    }
    ;
  }
  ;
})();
var transpileCtx = function* (code, ctx, semi = true) {
  {
    let input = uninterrupt(tokens(ctx, code));
    while (true) {
      {
        let macro__0 = astOne(ctx, input);
        if (macro__0) {
          {
            let node = macro__0;
            yield* transpileNodeStatement(ctx, node, null, null, evStat);
            if (semi) {
              yield ";";
            }
            ;
            ;
          }
        } else {
          return;
        }
        ;
      }
      ;
    }
    ;
  }
  ;
};
var transpile = function* (code, config) {
  return yield* transpileCtx(code, newCtx(config || {}, macros));
};
var count_DASH_newlines = (s) => {
  {
    let l = 0;
    for (let c of s) {
      if (c === "\n") {
        l++;
      }
      ;
    }
    ;
    return l;
  }
  ;
};
var transpileStr = (code, config = {}) => {
  {
    let parts = [];
    let map = new import_source_map_generator.SourceMapGenerator();
    let column = 0;
    let line = 1;
    for (let out of transpile(code, config)) {
      {
        let let_multi__13;
        if (typeof out === "string") {
          let_multi__13 = [out];
        } else {
          let_multi__13 = out;
        }
        ;
        let [part, partToken] = let_multi__13;
        if (config?.debug?.includes("sourcemap")) {
          console.log(part, partToken);
        }
        ;
        if (typeof partToken?.pos?.line === "number") {
          let hoist__14;
          if (partToken.kind === "symbol" && !partToken.value.includes(".")) {
            hoist__14 = mangleSym(partToken.value);
          } else {
            hoist__14 = null;
          }
          ;
          map.addMapping({ source: partToken.pos.source, original: { line: partToken.pos.line + 1, column: partToken.pos.column }, generated: { line, column }, name: hoist__14 });
        }
        ;
        column += part.length;
        line += count_DASH_newlines(part);
        parts.push(part);
      }
      ;
    }
    ;
    map.setSourceContent("builtin-macros.dak", builtinMacros);
    map.setSourceContent(get_DASH_source(config), code);
    {
      let mapJSON = map.toJSON();
      if (config.sourcemap === "inline") {
        parts.push("\n//# sourceMappingURL=data:application/json;base64,", btoa(JSON.stringify(mapJSON)));
      }
      ;
      return { code: parts.join(""), map: mapJSON };
    }
    ;
  }
  ;
};
var esbuildPlugin = () => {
  return { name: "dak", setup: ((lambda__15) => {
    return lambda__15.onLoad({ filter: /\.dak$/ }, (async ({ path }) => {
      const { readFile } = await import("node:fs/promises");
      ;
      return { contents: transpileStr(await readFile(path, { encoding: "utf8" }), { source: path, sourcemap: "inline" }).code, loader: "js" };
    }));
  }) };
};
if (typeof Bun !== "undefined" && import.meta.url.endsWith("bootstrap.mjs")) {
  Bun.plugin(esbuildPlugin());
}
if (typeof Bun === "undefined" && import.meta.url.endsWith("bootstrap.mjs")) {
  {
    let { registerHooks } = await import("node:module");
    let { readFileSync } = await import("node:fs");
    let { fileURLToPath } = await import("node:url");
    registerHooks({ load: ((url, ctx, nextLoad) => {
      if (url.endsWith(".dak")) {
        return { format: "module", shortCircuit: true, source: transpileStr(readFileSync(fileURLToPath(url), { encoding: "utf8" }), { source: url, sourcemap: "inline" }).code };
      } else {
        return nextLoad(url, ctx);
      }
      ;
    }) });
  }
}
if (false) {
  {
    let esbuild = await null;
    await esbuild.build({ entryPoints: [import.meta.dirname + "/transpiler.dak"], bundle: true, define: { ["import.meta.main"]: "false" }, format: "esm", platform: "node", outfile: import.meta.dirname + "/bootstrap.mjs", plugins: [esbuildPlugin()] });
  }
  ;
}
export {
  esbuildPlugin,
  transpile,
  transpileStr
};
