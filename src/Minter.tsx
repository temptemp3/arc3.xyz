import * as React from 'react'
import { Button, Elevation, FileInput, Card, Dialog, Classes, Collapse, NumericInput, FormGroup } from "@blueprintjs/core"
import { imageIntegrity, NFT, NFTMetadata } from './lib/nft'
import { SessionWallet } from 'algorand-session-wallet'
import { putToIPFS } from './lib/ipfs'
import{ useHistory } from 'react-router-dom'

export type MinterProps = {
    sw: SessionWallet
}

export function Minter(props: MinterProps){

    const history = useHistory()

    const [meta, setMeta]               = React.useState(new NFTMetadata())
    const [loading, setLoading]         = React.useState(false)
    const [imgSrc, setImgSrc]           = React.useState<string>();
    const [fileObj, setFileObj]         = React.useState<File>();
    const [decimals, setDecimals]       = React.useState(0)

    const [extraProps, setExtraProps]   = React.useState([])
    const [extraPropsVisible, setExtraPropsVisible] = React.useState(false)

    // For MintDialog
    const [cid, setCID]                 = React.useState("")
    const [isMinting, setIsMinting]     = React.useState(false)

    function setFile(file: File) {
        setFileObj(file)

        const reader = new FileReader();
        reader.onload = (e: any) => {  setImgSrc(e.target.result) }
        reader.readAsDataURL(file);

        setMeta((meta)=>{
            return new NFTMetadata({
                ...meta,
                image: file.name,
                image_mimetype: file.type,
                properties:{...meta.properties, size:file.size}
            })
        })
    }

    async function mintNFT() {
        setLoading(true) 
        const md = captureMetadata()
        md.image_integrity = await imageIntegrity(fileObj)
        setMeta(md)

        const cid = await putToIPFS(fileObj, md)
        setCID(cid)

        setIsMinting(true)
    }

    function handleCancelMint(){
        setIsMinting(false)
        setLoading(false)
    }

    function handleSetNFT(nft: NFT){
        return history.push("/nft/"+nft.token.id)
    }

    function handleChangeDecimals(v: number){ setDecimals(v) }

    function handleChangeMeta(event: { target: any; }) {
        const target = event.target

        const name = target.name as string
        const value = target.type === 'checkbox' ? target.checked : target.value as string

        setMeta((meta)=>{ return  new NFTMetadata({...meta, [name]:value}) })
    }

    function handleShowExtraProps(){ setExtraPropsVisible(!extraPropsVisible) }
    function handleExtraPropUpdate(e){
        const idx=parseInt(e.target.dataset.id)
        if(e.target.id==="name") extraProps[idx][e.target.id]=e.target.value
        else extraProps[idx][e.target.id] = e.target.value
        setExtraProps([...extraProps])
    }
    function handleExtraPropRemove(idx: number) { extraProps.splice(idx, 1); setExtraProps([...extraProps]) }
    function handleAddExtraProp() { setExtraProps([...extraProps, emptyExtraProp()]) }
    function emptyExtraProp(){ return { name:"", value: "" } }


    function captureMetadata(): NFTMetadata {
        const eprops = extraProps.reduce((all, ep)=>{ return {...all, [ep.name]:ep.value} }, {})
        return new NFTMetadata({
            name:           meta.name,
            unitName:       meta.unitName,
            description:    meta.description,
            image_mimetype: meta.image_mimetype,
            decimals:       decimals,
            properties:     { ...eprops, ...meta.properties}
        })
    }

    return (
        <div className='container'>
            <Card elevation={Elevation.TWO} >
                <Uploader
                    imgSrc={imgSrc}
                    setFile={setFile}
                    {...meta} />

                <div className='container' >
                    <FormGroup 
                        helperText="The Name for this asset"
                        label="Name"
                        labelFor="name"
                        labelInfo="(required)" >
                        <input
                            name='name'
                            placeholder='Name'
                            className='details-basic details-title bp3-input bp3-large'
                            onChange={handleChangeMeta}
                            type='text'
                            id='name'
                            value={meta.name} />
                    </FormGroup>
                    <FormGroup
                        helperText="The Unit Name for this asset "
                        label="Unit Name"
                        labelFor="unitName"
                        labelInfo="(required)" >
                        <input

                            name='unitName'
                            placeholder='Unit Name'
                            className='details-basic details-title bp3-input bp3-large'
                            onChange={handleChangeMeta}
                            type='text'
                            id='unitName'
                            value={meta.unitName} />
                    </FormGroup>
                </div>

                <div className='container'>
                    <FormGroup 
                        helperText="A description of this asset"
                        label="Description"
                        labelFor="description"
                        labelInfo="(required)" >
                        <textarea
                            rows={10}
                            cols={30}
                            placeholder='Description'
                            className='details-description bp3-input bp3-large'
                            onChange={handleChangeMeta}
                            name='description'
                            id='description'
                            value={meta.description} />
                    </FormGroup>
                </div>

                <div className='container'>
                    <FormGroup 
                        helperText="The number of decimals for this asset, increases number of units"
                        label="Decimals"
                        labelFor="decimals"
                        labelInfo="(A value > 0 is considered a 'Fractional NFT')" >
                        <NumericInput 
                            defaultValue={decimals} min={0} max={19} 
                            name='decimals'
                            id='decimals' 
                            fill={true}
                            onValueChange={handleChangeDecimals} />
                    </FormGroup>
                </div>

                <div className='container extra-prop-dropdown'>
                        <Button onClick={handleShowExtraProps}  minimal={true} outlined={true} text={extraPropsVisible?"Hide extra props":"Show extra props"} />
                        <Collapse isOpen={extraPropsVisible}>
                            <ul className='extra-prop-list'>
                            { 
                                extraProps.map((props, idx)=>{ 
                                    return (
                                    <li className='extra-prop-item' key={idx} >
                                        <div className='extra-prop-container'>
                                            <input 
                                                id="name" 
                                                data-id={idx}
                                                name="name" 
                                                value={props.name}  
                                                onChange={handleExtraPropUpdate} 
                                                className='details-basic details-artist bp3-input bp3-large' />
                                            <input 
                                                id="value" 
                                                name="value" 
                                                data-id={idx}
                                                value={props.value} 
                                                onChange={handleExtraPropUpdate} 
                                                className='details-basic details-artist bp3-input bp3-large' />
                                            <Button minimal={true} icon='minus' onClick={()=>{ handleExtraPropRemove(idx) }}  />
                                        </div>
                                    </li>
                                    )
                                })
                            }
                            </ul>
                            <Button fill={true} icon='plus' minimal={true} onClick={handleAddExtraProp} className='extra-prop-add' />
                        </Collapse>
                </div>

                <div className='container container-mint'>
                    <Button loading={loading}
                        onClick={mintNFT}
                        rightIcon='clean'
                        large={true}
                        minimal={true}
                        outlined={true}
                        intent='success'
                        text='Mint' />
                </div>
            </Card>
            <MintDialog 
                isMinting={isMinting} 
                cid={cid} 
                md={meta} 
                sw={props.sw}  
                handleSetNFT={handleSetNFT}
                handleCancelMint={handleCancelMint} 
                ></MintDialog>
        </div>
    )

}

type UploaderProps = {
    imgSrc: string | undefined
    setFile(f: File): void
};

function Uploader(props: UploaderProps) {
    function captureFile(event: any) {
        event.stopPropagation()
        event.preventDefault()
        props.setFile(event.target.files.item(0))
    }

    if (props.imgSrc === undefined || props.imgSrc === "" ) return (
        <div className='container'>
            <div className='content content-piece' >
                <FileInput large={true} disabled={false} text="Choose file..." onInputChange={captureFile} />
            </div>
        </div>
    )


    return (
        <div className='container' >
            <div className='content content-piece'>
                <img id="gateway-link" alt="NFT" src={props.imgSrc} />
            </div>
        </div>
    )
}

type MintDialogProps = {
    isMinting: boolean
    cid: string
    md: NFTMetadata
    sw: SessionWallet
    handleSetNFT(NFT)
    handleCancelMint()
}

function MintDialog(props: MintDialogProps){
    const [isLoading, setIsLoading] = React.useState(false)

    function cancel(){
        setIsLoading(false)
        props.handleCancelMint()
    }

    async function mint(){
        try {
            setIsLoading(true)
            const nft = await NFT.create(props.sw.wallet, props.md, props.cid)
            setIsLoading(false)
            props.handleSetNFT(nft)
        } catch (error) {
           alert("Failed to create nft: "+error) 
           setIsLoading(false)
           props.handleCancelMint()
        }
    }

    return (
        <Dialog isOpen={props.isMinting} title="Mint it" >
            <div className={Classes.DIALOG_BODY}>
                <p>File uploaded to ipfs {props.md.image} </p>
                <p>Click "Mint" to create ASA</p>
            </div>
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    <Button loading={isLoading} onClick={cancel}>Cancel</Button>
                    <Button loading={isLoading} onClick={mint}>Mint</Button>
                </div>
            </div>
        </Dialog>
    )
}