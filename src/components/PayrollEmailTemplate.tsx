
import React from 'react';
import {
  Html,
  Body,
  Head,
  Heading,
  Hr,
  Container,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';

interface PayrollEmailTemplateProps {
  employeeName: string;
  month: string;
  baseSalary: number;
  totalWorkerNet: number;
  bonuses: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
}

export const PayrollEmailTemplate = ({
  employeeName,
  month,
  baseSalary,
  totalWorkerNet,
  bonuses,
  deductions,
}: PayrollEmailTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>Recibo de Pago - {month}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Recibo de Pago de Nómina</Heading>
          <Text style={text}>
            Hola <strong>{employeeName}</strong>,
          </Text>
          <Text style={text}>
            Adjuntamos el resumen de tu pago correspondiente al mes de <strong>{month}</strong>.
          </Text>
          
          <Section style={section}>
            <Row>
              <Column>
                <Text style={label}>Sueldo Base</Text>
              </Column>
              <Column align="right">
                <Text style={value}>${baseSalary.toFixed(2)}</Text>
              </Column>
            </Row>
            
            {bonuses.length > 0 && (
              <>
                <Hr style={hr} />
                <Text style={subheading}>Asignaciones / Bonos</Text>
                {bonuses.map((b, i) => (
                  <Row key={i}>
                    <Column>
                      <Text style={itemLabel}>{b.name}</Text>
                    </Column>
                    <Column align="right">
                      <Text style={itemValue}>+${b.amount.toFixed(2)}</Text>
                    </Column>
                  </Row>
                ))}
              </>
            )}

            {deductions.length > 0 && (
              <>
                <Hr style={hr} />
                <Text style={subheading}>Deducciones</Text>
                {deductions.map((d, i) => (
                  <Row key={i}>
                    <Column>
                      <Text style={itemLabel}>{d.name}</Text>
                    </Column>
                    <Column align="right">
                      <Text style={itemValueRed}>-${d.amount.toFixed(2)}</Text>
                    </Column>
                  </Row>
                ))}
              </>
            )}

            <Hr style={hrBold} />
            <Row>
              <Column>
                <Text style={totalLabel}>Total Neto a Recibir</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>${totalWorkerNet.toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>

          <Text style={footer}>
            Este es un correo automático, por favor no respondas a este mensaje.
            Si tienes alguna duda, contacta al departamento de Recursos Humanos.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
};

const section = {
  padding: '24px 48px',
};

const subheading = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#8898aa',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  margin: '12px 0',
};

const label = {
  fontSize: '16px',
  color: '#333',
};

const value = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333',
};

const itemLabel = {
  fontSize: '14px',
  color: '#555',
};

const itemValue = {
  fontSize: '14px',
  color: '#2e7d32',
};

const itemValueRed = {
  fontSize: '14px',
  color: '#d32f2f',
};

const totalLabel = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333',
};

const totalValue = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1a73e8',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const hrBold = {
  borderColor: '#333',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  padding: '0 48px',
  marginTop: '40px',
};
