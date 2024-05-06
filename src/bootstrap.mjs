var at=Object.create;var P=Object.defineProperty;var ft=Object.getOwnPropertyDescriptor;var ct=Object.getOwnPropertyNames;var yt=Object.getPrototypeOf,dt=Object.prototype.hasOwnProperty;var ht=(t,e)=>()=>(t&&(e=t(t=0)),e);var B=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports),vt=(t,e)=>{for(var r in e)P(t,r,{get:e[r],enumerable:!0})},mt=(t,e,r,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of ct(e))!dt.call(t,n)&&n!==r&&P(t,n,{get:()=>e[n],enumerable:!(i=ft(e,n))||i.enumerable});return t};var pt=(t,e,r)=>(r=t!=null?at(yt(t)):{},mt(e||!t||!t.__esModule?P(r,"default",{value:t,enumerable:!0}):r,t));var ye=B(R=>{var ce="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");R.encode=function(t){if(0<=t&&t<ce.length)return ce[t];throw new TypeError("Must be between 0 and 63: "+t)};R.decode=function(t){var e=65,r=90,i=97,n=122,l=48,s=57,u=43,o=47,a=26,d=52;return e<=t&&t<=r?t-e:i<=t&&t<=n?t-i+a:l<=t&&t<=s?t-l+d:t==u?62:t==o?63:-1}});var pe=B(Y=>{var de=ye(),X=5,he=1<<X,ve=he-1,me=he;function gt(t){return t<0?(-t<<1)+1:(t<<1)+0}function _t(t){var e=(t&1)===1,r=t>>1;return e?-r:r}Y.encode=function(e){var r="",i,n=gt(e);do i=n&ve,n>>>=X,n>0&&(i|=me),r+=de.encode(i);while(n>0);return r};Y.decode=function(e,r,i){var n=e.length,l=0,s=0,u,o;do{if(r>=n)throw new Error("Expected more digits in base 64 VLQ value.");if(o=de.decode(e.charCodeAt(r++)),o===-1)throw new Error("Invalid base64 digit: "+e.charAt(r-1));u=!!(o&me),o&=ve,l=l+(o<<s),s+=X}while(u);i.value=_t(l),i.rest=r}});var F=B(m=>{function bt(t,e,r){if(e in t)return t[e];if(arguments.length===3)return r;throw new Error('"'+e+'" is a required argument.')}m.getArg=bt;var ge=/^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/,wt=/^data:.+\,.+$/;function T(t){var e=t.match(ge);return e?{scheme:e[1],auth:e[2],host:e[3],port:e[4],path:e[5]}:null}m.urlParse=T;function I(t){var e="";return t.scheme&&(e+=t.scheme+":"),e+="//",t.auth&&(e+=t.auth+"@"),t.host&&(e+=t.host),t.port&&(e+=":"+t.port),t.path&&(e+=t.path),e}m.urlGenerate=I;var kt=32;function St(t){var e=[];return function(r){for(var i=0;i<e.length;i++)if(e[i].input===r){var n=e[0];return e[0]=e[i],e[i]=n,e[0].result}var l=t(r);return e.unshift({input:r,result:l}),e.length>kt&&e.pop(),l}}var U=St(function(e){var r=e,i=T(e);if(i){if(!i.path)return e;r=i.path}for(var n=m.isAbsolute(r),l=[],s=0,u=0;;)if(s=u,u=r.indexOf("/",s),u===-1){l.push(r.slice(s));break}else for(l.push(r.slice(s,u));u<r.length&&r[u]==="/";)u++;for(var o,a=0,u=l.length-1;u>=0;u--)o=l[u],o==="."?l.splice(u,1):o===".."?a++:a>0&&(o===""?(l.splice(u+1,a),a=0):(l.splice(u,2),a--));return r=l.join("/"),r===""&&(r=n?"/":"."),i?(i.path=r,I(i)):r});m.normalize=U;function _e(t,e){t===""&&(t="."),e===""&&(e=".");var r=T(e),i=T(t);if(i&&(t=i.path||"/"),r&&!r.scheme)return i&&(r.scheme=i.scheme),I(r);if(r||e.match(wt))return e;if(i&&!i.host&&!i.path)return i.host=e,I(i);var n=e.charAt(0)==="/"?e:U(t.replace(/\/+$/,"")+"/"+e);return i?(i.path=n,I(i)):n}m.join=_e;m.isAbsolute=function(t){return t.charAt(0)==="/"||ge.test(t)};function Ct(t,e){t===""&&(t="."),t=t.replace(/\/$/,"");for(var r=0;e.indexOf(t+"/")!==0;){var i=t.lastIndexOf("/");if(i<0||(t=t.slice(0,i),t.match(/^([^\/]+:\/)?\/*$/)))return e;++r}return Array(r+1).join("../")+e.substr(t.length+1)}m.relative=Ct;var be=function(){var t=Object.create(null);return!("__proto__"in t)}();function we(t){return t}function Lt(t){return ke(t)?"$"+t:t}m.toSetString=be?we:Lt;function At(t){return ke(t)?t.slice(1):t}m.fromSetString=be?we:At;function ke(t){if(!t)return!1;var e=t.length;if(e<9||t.charCodeAt(e-1)!==95||t.charCodeAt(e-2)!==95||t.charCodeAt(e-3)!==111||t.charCodeAt(e-4)!==116||t.charCodeAt(e-5)!==111||t.charCodeAt(e-6)!==114||t.charCodeAt(e-7)!==112||t.charCodeAt(e-8)!==95||t.charCodeAt(e-9)!==95)return!1;for(var r=e-10;r>=0;r--)if(t.charCodeAt(r)!==36)return!1;return!0}function Ot(t,e,r){var i=L(t.source,e.source);return i!==0||(i=t.originalLine-e.originalLine,i!==0)||(i=t.originalColumn-e.originalColumn,i!==0||r)||(i=t.generatedColumn-e.generatedColumn,i!==0)||(i=t.generatedLine-e.generatedLine,i!==0)?i:L(t.name,e.name)}m.compareByOriginalPositions=Ot;function Mt(t,e,r){var i;return i=t.originalLine-e.originalLine,i!==0||(i=t.originalColumn-e.originalColumn,i!==0||r)||(i=t.generatedColumn-e.generatedColumn,i!==0)||(i=t.generatedLine-e.generatedLine,i!==0)?i:L(t.name,e.name)}m.compareByOriginalPositionsNoSource=Mt;function Nt(t,e,r){var i=t.generatedLine-e.generatedLine;return i!==0||(i=t.generatedColumn-e.generatedColumn,i!==0||r)||(i=L(t.source,e.source),i!==0)||(i=t.originalLine-e.originalLine,i!==0)||(i=t.originalColumn-e.originalColumn,i!==0)?i:L(t.name,e.name)}m.compareByGeneratedPositionsDeflated=Nt;function jt(t,e,r){var i=t.generatedColumn-e.generatedColumn;return i!==0||r||(i=L(t.source,e.source),i!==0)||(i=t.originalLine-e.originalLine,i!==0)||(i=t.originalColumn-e.originalColumn,i!==0)?i:L(t.name,e.name)}m.compareByGeneratedPositionsDeflatedNoLine=jt;function L(t,e){return t===e?0:t===null?1:e===null?-1:t>e?1:-1}function $t(t,e){var r=t.generatedLine-e.generatedLine;return r!==0||(r=t.generatedColumn-e.generatedColumn,r!==0)||(r=L(t.source,e.source),r!==0)||(r=t.originalLine-e.originalLine,r!==0)||(r=t.originalColumn-e.originalColumn,r!==0)?r:L(t.name,e.name)}m.compareByGeneratedPositionsInflated=$t;function Et(t){return JSON.parse(t.replace(/^\)]}'[^\n]*\n/,""))}m.parseSourceMapInput=Et;function Bt(t,e,r){if(e=e||"",t&&(t[t.length-1]!=="/"&&e[0]!=="/"&&(t+="/"),e=t+e),r){var i=T(r);if(!i)throw new Error("sourceMapURL could not be parsed");if(i.path){var n=i.path.lastIndexOf("/");n>=0&&(i.path=i.path.substring(0,n+1))}e=_e(I(i),e)}return U(e)}m.computeSourceURL=Bt});var Ce=B(Se=>{var x=F(),ee=Object.prototype.hasOwnProperty,j=typeof Map<"u";function A(){this._array=[],this._set=j?new Map:Object.create(null)}A.fromArray=function(e,r){for(var i=new A,n=0,l=e.length;n<l;n++)i.add(e[n],r);return i};A.prototype.size=function(){return j?this._set.size:Object.getOwnPropertyNames(this._set).length};A.prototype.add=function(e,r){var i=j?e:x.toSetString(e),n=j?this.has(e):ee.call(this._set,i),l=this._array.length;(!n||r)&&this._array.push(e),n||(j?this._set.set(e,l):this._set[i]=l)};A.prototype.has=function(e){if(j)return this._set.has(e);var r=x.toSetString(e);return ee.call(this._set,r)};A.prototype.indexOf=function(e){if(j){var r=this._set.get(e);if(r>=0)return r}else{var i=x.toSetString(e);if(ee.call(this._set,i))return this._set[i]}throw new Error('"'+e+'" is not in the set.')};A.prototype.at=function(e){if(e>=0&&e<this._array.length)return this._array[e];throw new Error("No element indexed by "+e)};A.prototype.toArray=function(){return this._array.slice()};Se.ArraySet=A});var Oe=B(Ae=>{var Le=F();function It(t,e){var r=t.generatedLine,i=e.generatedLine,n=t.generatedColumn,l=e.generatedColumn;return i>r||i==r&&l>=n||Le.compareByGeneratedPositionsInflated(t,e)<=0}function q(){this._array=[],this._sorted=!0,this._last={generatedLine:-1,generatedColumn:0}}q.prototype.unsortedForEach=function(e,r){this._array.forEach(e,r)};q.prototype.add=function(e){It(this._last,e)?(this._last=e,this._array.push(e)):(this._sorted=!1,this._array.push(e))};q.prototype.toArray=function(){return this._sorted||(this._array.sort(Le.compareByGeneratedPositionsInflated),this._sorted=!0),this._array};Ae.MappingList=q});var Ne=B(Me=>{var D=pe(),v=F(),z=Ce().ArraySet,Gt=Oe().MappingList;function b(t){t||(t={}),this._file=v.getArg(t,"file",null),this._sourceRoot=v.getArg(t,"sourceRoot",null),this._skipValidation=v.getArg(t,"skipValidation",!1),this._ignoreInvalidMapping=v.getArg(t,"ignoreInvalidMapping",!1),this._sources=new z,this._names=new z,this._mappings=new Gt,this._sourcesContents=null}b.prototype._version=3;b.fromSourceMap=function(e,r){var i=e.sourceRoot,n=new b(Object.assign(r||{},{file:e.file,sourceRoot:i}));return e.eachMapping(function(l){var s={generated:{line:l.generatedLine,column:l.generatedColumn}};l.source!=null&&(s.source=l.source,i!=null&&(s.source=v.relative(i,s.source)),s.original={line:l.originalLine,column:l.originalColumn},l.name!=null&&(s.name=l.name)),n.addMapping(s)}),e.sources.forEach(function(l){var s=l;i!==null&&(s=v.relative(i,l)),n._sources.has(s)||n._sources.add(s);var u=e.sourceContentFor(l);u!=null&&n.setSourceContent(l,u)}),n};b.prototype.addMapping=function(e){var r=v.getArg(e,"generated"),i=v.getArg(e,"original",null),n=v.getArg(e,"source",null),l=v.getArg(e,"name",null);!this._skipValidation&&this._validateMapping(r,i,n,l)===!1||(n!=null&&(n=String(n),this._sources.has(n)||this._sources.add(n)),l!=null&&(l=String(l),this._names.has(l)||this._names.add(l)),this._mappings.add({generatedLine:r.line,generatedColumn:r.column,originalLine:i!=null&&i.line,originalColumn:i!=null&&i.column,source:n,name:l}))};b.prototype.setSourceContent=function(e,r){var i=e;this._sourceRoot!=null&&(i=v.relative(this._sourceRoot,i)),r!=null?(this._sourcesContents||(this._sourcesContents=Object.create(null)),this._sourcesContents[v.toSetString(i)]=r):this._sourcesContents&&(delete this._sourcesContents[v.toSetString(i)],Object.keys(this._sourcesContents).length===0&&(this._sourcesContents=null))};b.prototype.applySourceMap=function(e,r,i){var n=r;if(r==null){if(e.file==null)throw new Error(`SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`);n=e.file}var l=this._sourceRoot;l!=null&&(n=v.relative(l,n));var s=new z,u=new z;this._mappings.unsortedForEach(function(o){if(o.source===n&&o.originalLine!=null){var a=e.originalPositionFor({line:o.originalLine,column:o.originalColumn});a.source!=null&&(o.source=a.source,i!=null&&(o.source=v.join(i,o.source)),l!=null&&(o.source=v.relative(l,o.source)),o.originalLine=a.line,o.originalColumn=a.column,a.name!=null&&(o.name=a.name))}var d=o.source;d!=null&&!s.has(d)&&s.add(d);var k=o.name;k!=null&&!u.has(k)&&u.add(k)},this),this._sources=s,this._names=u,e.sources.forEach(function(o){var a=e.sourceContentFor(o);a!=null&&(i!=null&&(o=v.join(i,o)),l!=null&&(o=v.relative(l,o)),this.setSourceContent(o,a))},this)};b.prototype._validateMapping=function(e,r,i,n){if(r&&typeof r.line!="number"&&typeof r.column!="number"){var l="original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.";if(this._ignoreInvalidMapping)return typeof console<"u"&&console.warn&&console.warn(l),!1;throw new Error(l)}if(!(e&&"line"in e&&"column"in e&&e.line>0&&e.column>=0&&!r&&!i&&!n)){if(e&&"line"in e&&"column"in e&&r&&"line"in r&&"column"in r&&e.line>0&&e.column>=0&&r.line>0&&r.column>=0&&i)return;var l="Invalid mapping: "+JSON.stringify({generated:e,source:i,original:r,name:n});if(this._ignoreInvalidMapping)return typeof console<"u"&&console.warn&&console.warn(l),!1;throw new Error(l)}};b.prototype._serializeMappings=function(){for(var e=0,r=1,i=0,n=0,l=0,s=0,u="",o,a,d,k,E=this._mappings.toArray(),O=0,ot=E.length;O<ot;O++){if(a=E[O],o="",a.generatedLine!==r)for(e=0;a.generatedLine!==r;)o+=";",r++;else if(O>0){if(!v.compareByGeneratedPositionsInflated(a,E[O-1]))continue;o+=","}o+=D.encode(a.generatedColumn-e),e=a.generatedColumn,a.source!=null&&(k=this._sources.indexOf(a.source),o+=D.encode(k-s),s=k,o+=D.encode(a.originalLine-1-n),n=a.originalLine-1,o+=D.encode(a.originalColumn-i),i=a.originalColumn,a.name!=null&&(d=this._names.indexOf(a.name),o+=D.encode(d-l),l=d)),u+=o}return u};b.prototype._generateSourcesContent=function(e,r){return e.map(function(i){if(!this._sourcesContents)return null;r!=null&&(i=v.relative(r,i));var n=v.toSetString(i);return Object.prototype.hasOwnProperty.call(this._sourcesContents,n)?this._sourcesContents[n]:null},this)};b.prototype.toJSON=function(){var e={version:this._version,sources:this._sources.toArray(),names:this._names.toArray(),mappings:this._serializeMappings()};return this._file!=null&&(e.file=this._file),this._sourceRoot!=null&&(e.sourceRoot=this._sourceRoot),this._sourcesContents&&(e.sourcesContent=this._generateSourcesContent(e.sources,e.sourceRoot)),e};b.prototype.toString=function(){return JSON.stringify(this.toJSON())};Me.SourceMapGenerator=b});var st={};vt(st,{transpile:()=>lt,transpileStr:()=>$i});var Te,De,Tt,Fe,qe,ze,g,je,$e,Ee,Dt,Ft,qt,Be,Ke,zt,Q,te,Qe,H,Kt,J,ue,Qt,f,h,He,oe,$,Ht,ae,Jt,Vt,Je,ie,Wt,ne,Zt,Pt,Rt,S,p,_,G,c,C,Xt,Yt,V,Ut,Ve,w,xt,N,We,W,ei,ti,ii,ri,y,Ie,Ge,ni,M,li,Ze,re,K,si,fe,ui,oi,ai,Pe,Re,Xe,fi,ci,yi,Ye,di,le,hi,Z,vi,mi,pi,gi,_i,Ue,bi,xe,wi,ki,et,tt,Si,Ci,se,Li,Ai,Oi,Mi,Ni,ji,it,rt,nt,lt,$i,ut=ht(()=>{Te=pt(Ne(),1),De=["(",")","[","]","{","}"],Tt=[...De,"@","#",":","'","~",","],Fe=[" ","\r",`
`,"	"],qe=`
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
`,ze=t=>t.source??"<anonymous>",g=(t,{pos:e={}},r)=>{{let i=Error(`${e.source}:${e.line+1}:${e.column+1}: ${r}`);return i.pos=e,i}},je=t=>{{let e=[];for(let r of t){let i;typeof r=="string"?i=r:i=r[0],e.push(i)}return e.join("")}},$e=t=>({scopes:[{},t],push:function(){return this.scopes.unshift({})},pop:function(){return this.scopes.shift()},add:function(e,r){return this.scopes[0][e]=r??!0},get:function(e){for(let r of this.scopes){let i=r[e];if(i)return i}}}),Ee=(t,e,r,i,n)=>{{let l=[],s={...n},u=n.offset+1;for(let o=u;o<i;o++)switch(n.offset++,n.column++,r[o]){case e:return n.offset++,n.column++,l.length===0?r.substring(u,o):(l.push(r.substring(u,o)),l.join(""));case`
`:n.line++,n.column=0,l.push(r.substring(u,o),"\\n"),u=o+1;break;case"\\":o++,n.offset++,r[o]===`
`?(n.line++,n.column=0):n.column+=2;break}throw g(t,{pos:s},"unterminated string")}},Dt=t=>t>="A"&&t<="Z"||t>="a"&&t<="z",Ft=(t,e,r,i)=>{{let n=i.offset+1;for(let l=n;l<r;l++)switch(i.offset++,i.column++,e[l]){case"/":for(i.offset++,i.column++;l++<r;){if(!Dt(e[l]))return e.substring(n-1,l);i.offset++,i.column++}break;case"\\":l++,i.offset++,i.column++;break}}throw g(t,t,"unterminated regex")},qt=(t,e,r,i)=>{{let n=i.offset;for(let l=n;l<r;l++){{let s=e[l];if(De.includes(s)||Fe.includes(s)||s===";")return e.substring(n,l)}i.offset++,i.column++}return e.substring(n,r)}},Be=(t,e,r,i)=>{{let n=i.offset;for(let l=n;l<r;l++)if(i.offset++,i.column++,e[l]===`
`)return i.line++,i.column=0,e.substring(n,l);return e.substring(n,r)}},Ke=function*(t,e){{let r={offset:0,line:0,column:0,source:ze(t)},i=e.length,n=null,l=null;for(t.pos={...r};r.offset<i;){let s=e[r.offset];if(s===`
`){r.line++,r.column=0,t.pos={...r},yield{kind:"newline",value:`
`,pos:r},r.offset++;continue}if(Fe.includes(s)){r.offset++,r.column++;continue}if(r.offset===0&&s==="#"&&e[1]==="!"){Be(t,e,i,r);continue}if(Tt.includes(s)){s==="#"&&e[r.offset+1]==="/"?(r.offset++,r.column++,l={...r},n=Ft(t,e,i,r),t.pos={...l},yield{kind:"regexp",value:n,pos:l}):(t.pos={...r},yield{kind:s,pos:{...r}},r.offset++,r.column++);continue}switch(s){case'"':l={...r},n=Ee(t,'"',e,i,r),t.pos={...l},yield{kind:"string",value:n,pos:l};break;case"`":l={...r},n=Ee(t,"`",e,i,r),t.pos={...l},yield{kind:"template",value:n,pos:l};break;case";":l={...r},n=Be(t,e,i,r),t.pos={...l},yield{kind:"comment",value:n,pos:l};break;default:l={...r},n=qt(t,e,i,r),t.pos={...l},yield{kind:"symbol",value:n,pos:l};break}}}},zt=({kind:t})=>t==="comment"||t==="newline",Q=(t,e,{pos:r})=>{{let i=t;return Object.defineProperty(i,"kind",{value:e,enumerable:!1}),Object.defineProperty(i,"pos",{value:r,enumerable:!1}),i}},te=function*(t,e,r,i){{let n={...t.pos};for(let l of e)if(!zt(l)){if(l.kind===r)return;yield J(t,Qt(l,e))}throw g(t,{pos:n},`unterminated ${i}`)}},Qe=(t,e,r)=>{{let i={...t.pos};{let n=J(t,e);if(n)return n;throw g(t,{pos:i},`unterminated ${r}`)}}},H=(t,e,r,i)=>Q([{kind:"symbol",pos:e.pos,value:r},Qe(t,i,r)],"list",e),Kt=(t,e,r)=>{{let i=H(t,e,"hash",r);return i.length===2&&i[1].kind==="symbol"?{kind:"symbol",value:"#"+i[1].value,pos:i.pos}:i}},J=(t,e)=>{for(;;){let{value:r,done:i}=e.next();if(i)return;switch(r.kind){case"newline":case"comment":continue;case"string":case"template":case"regexp":case"symbol":return r;case"(":return Q([...te(t,e,")","list")],"list",r);case"[":return Q([...te(t,e,"]","array")],"array",r);case"{":return Q([...te(t,e,"}","object")],"object",r);case"'":return H(t,r,"quote",e);case",":return H(t,r,"unquote",e);case"@":return H(t,r,"await",e);case"#":return Kt(t,r,e);case":":{let n=Qe(t,e,"keyword");if(n.kind!=="symbol")throw g(t,r,"invalid keyword");return n.kind="string",n.pos=r.pos,n}break;default:throw g(t,r,`unknown token ${r.kind}`)}}},ue=t=>({next:()=>t.next(),[Symbol.iterator]:function(){return this}}),Qt=(t,e)=>ue(function*(){return yield t,yield*e}()),f="evExpr",h="evStat",He=t=>{let e=[],r=(i,n,l)=>{{let s=[...p(t,t.gensym("hoist"))],u=[...s,"="];return e.push("let ",...s,";",...i(t,n,u,r,h),";"),[..._(t,l),...s]}};return[r,e]},oe=t=>function*(e,r,i,n,l){{let[s,u]=He(e),o=[...t(e,r,i,s,l)];return yield*u,yield*o}},$=t=>{let e=!0;return()=>e?(e=!1,""):t},Ht=t=>t.match(/^[a-zA-Z_$][0-9a-zA-Z_$]*$/),ae=t=>t.kind==="string"&&Ht(t.value),Jt=function*(t,e,r){yield["{",e];for(let i=0;i<e.length;i++)e[i].kind==="symbol"&&e[i].value.startsWith("...")?yield*p(t,e[i]):e[i].kind==="list"&&e[i][0].kind==="symbol"&&e[i][0].value==="..."?(yield["...",e[i]],yield*c(t,e[i][1],null,r,f)):(ae(e[i])?yield[e[i].value,e[i]]:(yield"[",yield*c(t,e[i],null,r,f),yield"]"),yield":",yield*c(t,e[i+1],null,r,f),i++),yield",";return yield"}"},Vt=function*(t,e,r){yield["[",e];for(let i of e)yield*c(t,i,null,r,f),yield",";return yield"]"},Je=function*(t,e){return yield['"',e],yield e.value,yield'"'},ie="${",Wt="}",ne=(t,e)=>{{let r=t.indexOf(ie,e);return r===-1?-1:r===0?ie.length:t[r-1]==="\\"?ne(t,r):r+ie.length}},Zt=function*(t,e,r){yield["`",e];{let i=0,n=ne(e.value);for(;n!=-1;){if(yield[e.value.slice(i,n),e],i=e.value.indexOf(Wt,n),i===-1)throw g(t,e,"invalid template literal");yield*nt(e.value.slice(n,i),t,!1),n=ne(e.value,n)}return yield[e.value.slice(i),e],yield"`"}},Pt=function*(t,e){return yield[e.value,e]},Rt={"!":"_BANG_","/":"_FSLASH_","\\":"_RSLASH_","?":"_QMARK_","*":"_STAR_","+":"_PLUS_",">":"_GT_","<":"_LT_","=":"_EQ_","-":"_DASH_"},S=(t,e=!0)=>{{let r=t[0];if(r==="-"||(r==="."&&(r=t.at(1)),r>="0"&&r<="9"))return t}{let r=[],i=0;e&&t.startsWith("...#")&&(r.push("...this.#"),i=4);for(let n=0;n<t.length;n++){let l=t[n];e&&n===0&&l==="#"&&r.push("this.");{let s=Rt[l];if(s){let u=s;u&&(l!=="?"||t[n+1]!==".")&&(r.push(t.slice(i,n),u),i=n+1)}}}return r.length===0?t:(r.push(t.slice(i,t.length)),r.join(""))}},p=function*(t,e){return yield[S(e.value),e]},_=function*(t,e){if(e)return typeof e=="string"?yield e:yield*e},G=function*(t,e,r,i,n){if(e.kind==="list")return yield*Li(t,e,r,i,n);switch(yield*_(t,r),e.kind){case"object":return yield*Jt(t,e,i);case"array":return yield*Vt(t,e,i);case"regexp":return yield*Pt(t,e);case"string":return yield*Je(t,e);case"template":return yield*Zt(t,e,i);case"symbol":return yield*p(t,e);default:throw g(t,e,`unhandled node "${e.kind}"`)}},c=G,C=oe(G),Xt=function*(t,e){{let r=null,i=null,n=[],l=!1,s=$(",");for(let u=1;u<e.length;u++){let o=e[u];switch(o.kind){case"array":for(let a of o)n.push(S(a.value));break;case"symbol":r=o;break;case"string":if(o.value!=="as")throw g(t,o,`unexpected import string "${o.value}"`);u++,i=e[u];break;case"object":for(let a=0;a<o.length;a+=2)n.push(`${S(o[a].value)} as ${S(o[a+1].value)}`);break;default:throw g(t,o,"unexpected import")}}return yield["import ",e],r&&(l=!0,yield s(),yield*p(t,r)),n.length>0&&(l=!0,yield s(),yield"{",yield n.join(","),yield"}"),i&&(l=!0,yield s(),yield["* as ",i],yield*p(t,i)),l&&(yield" from "),yield*Je(t,e[0]),yield";"}},Yt=function*(t,e,r,i,n){if(e[1].kind==="array")for(let l=1;l<e.length;l++)yield*Xt(t,e[l]);else return yield*se(t,e,r,i,n)},V=(t,e)=>{if(e?.[1]?.value==="^:export"){let r=[["export ",e[1]]],i=2;return e?.[2]?.value==="^:default"&&(r.push(["default ",e[2]]),i++),[r,i]}else return[[],1]},Ut=oe(function*(t,e,r,i){{let[n,l]=V(t,e);return yield*n,yield[e[0].value,e[0]],yield" ",yield*N(t,e[l]),yield"=",yield*c(t,e[l+1],null,i,f),yield";"}}),Ve=function*(t,e,r,i){{let[n,l]=V(t,e),[s,u]=He(t),o=[...N(t,e[l]),"="],a=[...c(t,e[l+1],o,s,f)];return yield*n,yield[e[0].value,e[0]],yield" ",(u.length>0||a[0]!==o[0])&&(yield*p(t,e[l]),yield";",yield*u),yield*a}},w=oe(function*(t,e,r,i){for(let n=0;n<e.length;n++){let l=null;n===e.length-1&&(l=r),yield*C(t,e[n],l,i,h),yield";"}}),xt=function*(t,e,r,i,n){return yield*w(t,e.slice(1),r,i,n)},N=function*(t,e){switch(e.kind){case"symbol":return t.bindings.add(e.name),yield*p(t,e);case"array":yield["[",e];for(let r of e)yield*N(t,r),yield",";return yield"]";case"object":{let r=[],i={},n={},l=$(",");for(let s=0;s<e.length;s+=2){let u=e[s],o=e[s+1];if(u.kind==="symbol"){i[u.value]=o.value,r.includes(u.value)||r.push(u.value);continue}switch(u.value){case"keys":for(let a of o)r.push(a.value);break;case"or":for(let a=0;a<o.length;a+=2)n[o[a].value]=[...G(t,o[a+1])],r.includes(o[a].value)||r.push(o[a].value);break;default:throw g(t,e[s],`unexpected destructuring map op "${u.value}"`)}}yield"{";for(let s of r)yield l(),yield S(s),Object.hasOwn(i,s)?(yield":",yield S(i[s]),t.bindings.add(i[s])):t.bindings.add(s),Object.hasOwn(n,s)&&(yield"=",yield*n[s]);return yield"}"}case"list":return yield*G(t,e[0]),yield"=",yield*G(t,e[1]);default:throw g(t,e,`unexpected destructure "${e.kind}"`)}},We=function*(t,e){{let r=$(",");yield"(";for(let i of e)yield r(),yield*N(t,i);return yield")"}},W=(t,e)=>function*(r,i,n,l,s){{let u=t,o=e,[a,d]=V(r,i),k=!1;yield*_(r,n),yield*a,i[d].value==="^:decl"&&(k=!0,u="",o="",d++);{let E=i[d].kind==="symbol",O=s===f||!E;if(O&&(yield"("),k&&(t===""?yield["function",i]:t==="async"&&(yield["async function",i])),E&&(k?(yield" ",yield*p(r,i[d])):(yield["const ",i],yield*p(r,i[d]),yield"="),r.bindings.add(i[d].value),d++),yield u,yield*We(r,i[d]),yield o,yield"{",yield*w(r,i.slice(d+1),"return ",null,h),yield"}",O)return yield")"}}},ei=W("","=>"),ti=W("async","=>"),ii=W("function*",""),ri=W("async function*",""),y=(t,e)=>function*(r,i,n,l,s){yield*_(r,n),yield"(",e&&i.length===2&&(yield[t,i[0]]);{let u=$([t,i[0]]);for(let o=1;o<i.length;o++)yield u(),yield*c(r,i[o],null,l,f)}return yield")"},Ie=t=>function*(e,r,i,n,l){return yield*_(e,i),yield"(",yield[t,r[0]],yield*c(e,r[1],null,n,f),yield")"},Ge=t=>function*(e,r,i,n,l){return yield*_(e,i),yield"(",yield*c(e,r[1],null,n,f),yield[t,r[0]],yield")"},ni={"=":"===","not=":"!=="},M=function*(t,e,r,i,n){yield*_(t,r),yield*c(t,e[1],null,i,f);{let l=e[0].value;yield[ni[l]??l,e[0]]}return yield*c(t,e[2],null,i,f)},li=function*(t,e,r,i,n){return e[1].kind==="array"?yield*Ze(t,e,r,i,n):yield*Ve(t,e,r,i,n)},Ze=function*(t,e,r,i,n){if(n===f){yield*i(Ze,e,r);return}t.bindings.push(),yield"{";for(let l=0;l<e[1].length;l+=2){let s=e[1][l],u=null;s.kind==="symbol"?(t.bindings.add(s.value),u=[...p(t,s)]):u=[...p(t,t.gensym("let_multi"))];{let o=[...u,"="],a=[...C(t,e[1][l+1],o,i,h)];if(a[0]===o[0]){s.kind!=="symbol"?(yield["let ",e],yield*N(t,s),yield"=",yield*a.slice(2)):(yield["let ",e],yield*a),yield";";continue}yield"let ",yield*u,yield";",yield*a,yield";",s.kind!=="symbol"&&(yield"let ",yield*N(t,s),yield"=",yield*u,yield";")}}return yield*w(t,e.slice(2),r,i,h),yield"}",t.bindings.pop()},re=function*(t,e,r,i,n){if(yield*_(t,r),n===f&&(yield"("),yield[e[0].value,e],e.length!==1&&(yield" ",yield*c(t,e[1],null,i,f)),n===f)return yield")"},K=function*(t,e,r,i,n){return e.length===1?yield[e[0].value,e]:yield*C(t,e[1],[e[0].value," "],i,h)},si=function*(t,e,r,i,n){{let l=e[1];return yield"for(let ",yield*p(t,l[0]),yield"=",yield*c(t,l[1],null,i,f),yield";",yield*p(t,l[0]),yield"<",yield*c(t,l[2],null,i,f),yield";",yield*p(t,l[0]),l.length===3?yield"++":(yield"+=",yield*c(t,l[3],null,i,f)),yield"){",yield*w(t,e.slice(2),null,i,h),yield"}"}},fe=(t,e)=>function*(r,i,n,l,s){{let u=i[1];return yield[t,i[0]],yield"(let ",yield*N(r,u[0]),yield[" ",i[0]],yield e,yield" ",yield*c(r,u[1],null,l,f),yield["){",i[0]],yield*w(r,i.slice(2),null,l,h),yield"}"}},ui=fe("for","of"),oi=fe("for","in"),ai=fe("for await","of"),Pe=function*(t,e,r,i,n){if(n===f){yield*i(Pe,e,r);return}{let l=$("else "),s=e.length%2===0;for(let u=1;u<e.length;u+=2){if(s&&u===e.length-1){yield"else{",yield*C(t,e[u],r,i,h),yield"}";return}yield l(),yield["if(",e[0]],yield*c(t,e[u],null,i,f),yield"){",yield*C(t,e[u+1],r,i,h),yield"}"}}},Re=function*(t,e,r,i,n){if(n===f){yield*i(Re,e,r);return}return yield["while(",e],yield*c(t,e[1],null,f),yield"){",yield*w(t,e.slice(2),null,i,h),yield"}"},Xe=function*(t,e,r,i,n){if(n===f&&!r){yield*i(Xe,e,r);return}{let l=e.length%2>0;yield["switch (",e],yield*c(t,e[1],null,i,f),yield"){";for(let s=2;s<e.length;s+=2){if(l&&s===e.length-1){yield"default:",yield*C(t,e[s],r,i,h),yield";",r!=="return "&&(yield"break"),yield"}";return}if(e[s].kind==="array")for(let u=0;u<e[s].length;u++)yield["case ",e[s][u]],yield*c(t,e[s][u],null,i,f),yield[":",e[s][u]];else yield["case ",e[s]],yield*c(t,e[s],null,i,f),yield[":",e[s]];yield*C(t,e[s+1],r,i,h),yield";",r!=="return "&&(yield"break;")}return yield"}"}},fi=function*(t,e,r,i,n){yield*_(t,r),yield*c(t,e[1],null,i,f);for(let l=2;l<e.length;l++)yield"?.",ae(e[l])?yield[e[l].value,e[l]]:(yield"[",yield*c(t,e[l],null,i,f),yield"]")},ci=function*(t,e,r,i,n){yield*_(t,r),yield*c(t,e[1],null,i,f);for(let l=2;l<e.length;l++)ae(e[l])?(yield".",yield[e[l].value,e[l]]):(yield"[",yield*c(t,e[l],null,i,f),yield"]")},yi=function*(t,e,r,i,n){return yield["...",e],yield*C(t,e[1],r,i,n)},Ye=function*(t,e,r,i,n){if(n===f){yield*i(Ye,e,r);return}{let l=e.length,s=null,u=null;if(e?.[l-1]?.[0]?.value==="finally"&&(u=e[l-1],l--),e?.[l-1]?.[0]?.value==="catch"&&(s=e[l-1],l--),!u&&!s)throw g(t,e,"at least one of catch or finally is required");if(yield["try{",e],yield*w(t,e.slice(1,l),r,i,h),yield"}",s&&(yield["catch(",s],yield*c(t,s[1],null,null,f),yield"){",yield*w(t,s.slice(2),r,null,h),yield"}"),u)return yield["finally{",u],yield*w(t,u.slice(1),null,null,h),yield"}"}},di=function*(t,e){return yield["static{",e],yield*w(t,e.slice(1),null,null,h),yield"}"},le=function*(t,e){return yield[S(e.value,!1),e]},hi=function*(t,e,r,i){{let n=1,l=!1;if(e[n].value==="^:static"&&(l=!0,yield["static ",e[n]],n++),e[n].kind==="array"){{let s=e[n].length;for(let u of e[n])yield*le(t,u),yield";",s--,l&&s>0&&(yield"static ")}return}return yield*le(t,e[n]),n++,e[n]&&(yield"=",yield*c(t,e[n],null,null,f)),yield";"}},Z=t=>function*(e,r){{let i=1;return r[i].value==="^:static"&&(yield["static ",r[i++]]),r[i].value==="^:get"?yield["get ",r[i++]]:r[i].value==="^:set"?yield["set ",r[i++]]:yield[t,r],yield*le(e,r[i++]),yield*We(e,r[i++]),yield"{",yield*w(e,r.slice(i++),"return ",null,h),yield"}"}},vi=Z(""),mi=Z("async "),pi=Z("*"),gi=Z("async *"),_i={let:hi,fn:vi,"fn@":mi,"fn*":pi,"fn@*":gi,static:di},Ue=function*(t,e,r,i,n){{let l=e[0].value;{let s=_i[l];if(s){yield*s(t,e,r,i,n);return}}{let s=t.macros.get(l);if(s){yield*Ue(t,s(...e),r,i,n);return}}}throw g(t,e[0],`unexpected class body "${e[0].kind}"`)},bi=function*(t,e,r,i,n){yield*_(t,r);{let[l,s]=V(t,e);yield*l,yield["class",e[0]],e?.[s]?.kind==="symbol"&&(yield" ",yield*p(t,e[s]),t.bindings.add(e[s].value),s++),e?.[s]?.kind==="string"&&e?.[s]?.value==="extends"&&(yield[" extends ",e[s]],yield*c(t,e[s+1],null,i,f),s+=2),yield"{";for(let u=s;u<e.length;u++)yield*Ue(t,e[u],null,null,h);return yield"}"}},xe=(t,e,r)=>{if(Array.isArray(r)&&r?.[0]?.value!=="hash"){r.forEach(i=>xe(t,e,i));return}else{if(r.kind!=="symbol")return;if(r.value.startsWith("...$")){e.rest||(e.rest=t.gensym("lambda_rest")),r.value=`${e.rest.value}${r.value.slice(4)}`;return}else if(!r.value.startsWith("$"))return}{let i=r.value,n=i.indexOf("."),l;n<0?l=i:l=i.slice(0,n);let s=l.endsWith("?"),u="",o=0;s&&(l=l.slice(0,-1),u="?"),l!=="$"&&(o=parseInt(l.slice(1),10)-1);for(let a=0;a<o+1;a++)e[a]||(e[a]=t.gensym("lambda"));{let a=e[o].value,d;return n<0?d=a:d=`${a}${u}${i.slice(n)}`,r.value=d}}},wi=function*(t,e,r,i,n){yield*_(t,r);{let l=[],s=$(",");xe(t,l,e[1]),yield"((";for(let u of l)yield s(),yield*p(t,u);return l.rest&&(yield s(),yield"...",yield*p(t,l.rest)),yield")=>{",yield*C(t,e[1],"return ",i,h),yield"})"}},ki=function*(t,e,r,i,n){if(e[1].kind==="list")return yield*wi(t,e,r,i,n);throw g(t,t,`unexpected hash "${e[1].kind}"`)},et=function*(t,e,r){if(Array.isArray(e)){if(e?.[0]?.value==="unquote")return yield*c(t,e[1],null,r,f);yield"Object.defineProperties([";for(let i of e)yield*et(t,i,r),yield",";return yield"],",yield JSON.stringify({kind:{value:e.kind,enumerable:!1},pos:{value:e.pos,enumerable:!1}}),yield")"}else return yield JSON.stringify(e)},tt=(t,e,r)=>{if(Array.isArray(r))return r.forEach(i=>tt(t,e,i));if(r.kind==="symbol"&&r.value.includes("#")){let[i,n]=r.value.split("#");{let l=e[i];if(l){let s=l;return r.value=s+n}else{let s=t.gensym("macro").value;return e[i]=s,r.value=s+n}}}},Si=function*(t,e,r,i,n){return tt(t,{},e),yield*_(t,r),yield*et(t,e[1],i)},Ci=function*(t,e){{let r=e[2].map(n=>je(N(t,n))),i=je(w(t,e.slice(3),"return "));return t.macros.add(e[1].value,new Function("_macroName",...r,i))}},se=function*(t,e,r,i,n){yield*_(t,r);{let l=1;if(e[0].kind==="symbol"){let s=e[0].value;s.endsWith(".")?(yield["new ",e[0]],yield[S(s.slice(0,-1)),e[0]]):s.startsWith(".")?(yield*c(t,e[1],null,i,f),yield[S(s),e[0]],l=2):yield[S(s),e]}else yield*c(t,e[0],null,i,f);{let s=$(",");yield"(";for(let u=l;u<e.length;u++)yield s(),yield*c(t,e[u],null,i,f);return yield")"}}},Li=function*(t,e,r,i,n){{let l=e[0].value,s=t.bindings.get(l);if(s===!0){yield*se(t,e,r,i,n);return}if(s){yield*s(t,e,r,i,n);return}{let u=t.macros.get(l);if(u){yield*G(t,u(...e),r,i,n);return}}}return yield*se(t,e,r,i,n)},Ai=function*(t,e,r,i,n){return yield["typeof ",e[0]],yield*c(t,e[1],r,i,f)},Oi=function*(t,e,r,i,n){return yield*c(t,e[1],r,i,f),yield[" instanceof ",e[0]],yield*c(t,e[2],r,i,f)},Mi=function*(t,e,r,i,n){return yield["delete ",e[0]],yield*c(t,e[1],r,i,f)},Ni=function*(t,e,r,i,n){return yield*c(t,e[2],[...c(t,e[1],r,i,f),"="],i,f)},ji={import:Yt,const:Ut,var:Ve,fn:ei,"fn@":ti,"fn*":ii,"fn@*":ri,str:y("+"),"+":y("+",!0),"-":y("-",!0),"*":y("*"),"/":y("/"),"**":y("**"),"%":y("%"),"+=":y("+="),"-=":y("-="),"&=":y("&="),"|=":y("|="),"/=":y("/="),"*=":y("*="),"**=":y("**="),"<<=":y("<<="),">>=":y(">>="),">>>=":y(">>>="),"||=":y("||="),"??=":y("??="),"%=":y("%="),"??":y("??"),"<<":y("<<"),">>":y(">>"),">>>":y(">>>"),"++":Ge("++"),"--":Ge("--"),"bit-and":y("&"),"bit-or":y("|"),"bit-not":Ie("~"),"bit-xor":y("^"),"||":y("||"),or:y("||"),"&&":y("&&"),and:y("&&"),not:Ie("!"),in:y(" in "),"=":M,"==":M,"!=":M,"not=":M,"<":M,">":M,"<=":M,">=":M,let:li,throw:K,return:K,yield:re,"yield*":re,break:K,continue:K,await:re,for:si,"for@":ai,"for-of":ui,"for-in":oi,case:Xe,do:xt,if:Pe,while:Re,".":ci,"?.":fi,"...":yi,typeof:Ai,instanceof:Oi,set:Ni,delete:Mi,hash:ki,quote:Si,macro:Ci,try:Ye,class:bi},it={},rt=(t,e)=>{let r=0;return{...t,bindings:$e(ji),macros:$e(e),gensym:i=>(i=i??"gensym",{kind:"symbol",value:`${i}__${r++}`,pos:{}})}};it=(()=>{{let t=rt({source:"builtin-macros.dak"},{}),e=ue(Ke(t,qe));for(;;){let r=J(t,e);if(r)[...C(t,r,null,null,h)];else return t.macros.scopes[0]}}})();nt=function*(t,e,r=!0){{let i=ue(Ke(e,t));for(;;){let n=J(e,i);if(n)yield*C(e,n,null,null,h),r&&(yield";");else return}}},lt=function*(t,e){return yield*nt(t,rt(e||{},it))},$i=(t,e={})=>{{let r=[],i=new Te.SourceMapGenerator,n=0;for(let l of lt(t,e)){let s;typeof l=="string"?s=[l]:s=l;let[u,o]=s;if(typeof o?.pos?.line=="number"){let a;o.kind==="symbol"&&!o.value.includes(".")?a=S(o.value):a=null,i.addMapping({source:o.pos.source,original:{line:o.pos.line+1,column:o.pos.column},generated:{line:1,column:n},name:a})}n+=u.length,r.push(u)}i.setSourceContent("builtin-macros.dak",qe),i.setSourceContent(ze(e),t);{let l=i.toJSON();return e.sourcemap==="inline"&&r.push(`
//# sourceMappingURL=data:application/json;base64,`,btoa(JSON.stringify(l))),{code:r.join(""),map:l}}}}});import{plugin as Ei}from"bun";Ei({name:"dak",async setup(t){let{transpileStr:e}=await Promise.resolve().then(()=>(ut(),st));t.onLoad({filter:/\.dak$/},async({path:r})=>{let i=await Bun.file(r).text();return{contents:e(i,{source:r,sourcemap:"inline"}).code,loader:"js"}})}});
