// Copyright (c) 2018, Rubén Rincón
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright notice,
//       this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

const BaseCompiler = require('../base-compiler'),
    argumentParsers = require("./argument-parsers"),
    path = require('path');

class DMDCompiler extends BaseCompiler {
    constructor(compiler, env) {
        super(compiler, env);
        this.compiler.supportsIntel = true;
    }

    optionsForFilter(filters, outputFilename) {
        return ['-g', '-of' + this.filename(outputFilename)];
    }

    execPostProcess(result, postProcesses, outputFilename, maxSize) {
        const dirPath = path.dirname(outputFilename);
        const lPath = path.basename(outputFilename);
        return this.exec(postProcesses[0], ["-l", lPath], {customCwd: dirPath, maxOutput: maxSize})
            .then(postResult => this.handlePostProcessResult(result, postResult));
    }

    getOutputFilename(dirPath, outputFilebase) {
        return path.join(dirPath, `${outputFilebase}.s`);
    }

    buildExecutable(compiler, options, inputFilename, execOptions) {
        options = options.filter((param) => param !== "-c");

        return this.runCompiler(compiler, options, inputFilename, execOptions);
    }

    objdump(outputFilename, result, maxSize, intelAsm, demangle) {
        const dirPath = path.dirname(outputFilename);
        let args = ["-d", outputFilename, "-l", "--insn-width=16"];
        if (demangle) args = args.concat("-C");
        if (intelAsm) args = args.concat(["-M", "intel"]);
        return this.exec(this.compiler.objdumper, args, {maxOutput: maxSize, customCwd: dirPath})
            .then(objResult => {
                result.asm = objResult.stdout;
                if (objResult.code !== 0) {
                    result.asm = `<No output: objdump returned ${objResult.code}>`;
                }
                return result;
            });
    }

    getArgumentParser() {
        return argumentParsers.Clang;
    }

    filterUserOptions(userOptions) {
        return userOptions.filter(option => option !== '-run' && option !== '-man' && !option.startsWith("-Xf"));
    }
}

module.exports = DMDCompiler;
