declare namespace LEP
{
    function parse(requirements: string, tokenChecker: (requirement: string) => boolean): boolean;
}

export = LEP;
